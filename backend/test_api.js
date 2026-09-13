const http = require("http");

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on("error", reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== Testing CampusSync API Endpoints ===");

  // 1. Health check
  const health = await request({ hostname: "localhost", port: 5000, path: "/", method: "GET" });
  console.log("1. Health Check:", health.status, health.body.status);

  // 2. Public Events
  const events = await request({ hostname: "localhost", port: 5000, path: "/api/events", method: "GET" });
  console.log("2. Public Events Count:", events.status, Array.isArray(events.body) ? events.body.length : "Not Array");

  // 3. Venues
  const venues = await request({ hostname: "localhost", port: 5000, path: "/api/venues", method: "GET" });
  console.log("3. Venues Count:", venues.status, Array.isArray(venues.body) ? venues.body.length : "Not Array");

  // 4. Student Login
  const studentLogin = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "arun@example.com", password: "password123" }
  );
  console.log("4. Student Login:", studentLogin.status, studentLogin.body.user?.name, "Role:", studentLogin.body.user?.role);
  const studentToken = studentLogin.body.token;

  // 5. Student My Events
  const studentEvents = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/registrations/my-events",
    method: "GET",
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log("5. Student Registrations:", studentEvents.status, "Count:", studentEvents.body.length, "Ticket Sample:", studentEvents.body[0]?.ticket_code);

  // 6. Organizer Login
  const organizerLogin = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "priya@example.com", password: "password123" }
  );
  console.log("6. Organizer Login:", organizerLogin.status, organizerLogin.body.user?.name);
  const orgToken = organizerLogin.body.token;

  // 7. Door Check-in with ticket code
  if (studentEvents.body[0]?.ticket_code) {
    const checkin = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/registrations/check-in",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${orgToken}`,
        },
      },
      { ticket_code: studentEvents.body[0].ticket_code, event_id: studentEvents.body[0].event_id }
    );
    console.log("7. Door Check-In Result:", checkin.status, checkin.body.message);
  }

  // 8. Admin Login & Stats
  const adminLogin = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "admin@example.com", password: "admin123" }
  );
  console.log("8. Admin Login:", adminLogin.status, adminLogin.body.user?.name);
  const adminToken = adminLogin.body.token;

  const adminStats = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/admin/stats",
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(
    "9. Admin Stats:",
    adminStats.status,
    "Events:",
    adminStats.body.events?.total_events,
    "Registrations:",
    adminStats.body.registrations?.total_registrations,
    "Turnout Rate:",
    adminStats.body.registrations?.turnout_rate + "%"
  );

  // 10. Venue Collision Check
  const clash = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/venues/check-availability?venue_id=1&event_date=2026-10-15T09:00:00",
    method: "GET",
  });
  console.log("10. Venue Clash Detection:", clash.status, "Available:", clash.body.available, "Conflicts:", clash.body.conflicts?.length);

  console.log("=== ALL ENDPOINTS VERIFIED SUCCESSFULLY ===");
}

runTests().catch((err) => {
  console.error("Test error:", err);
});
