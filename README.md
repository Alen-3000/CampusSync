# CampusSync 🎓
### Institutional College Event Management Operating System

CampusSync is a production-grade, university-level Event Management Platform engineered to handle complete campus event lifecycles: Proposal & Dean approval, conflict-free venue booking, automated waitlists, digital QR ticketing, live smartphone camera gate scanning, attendee CSV roster exports, post-event student ratings, and verifiable certificates of participation.

---

## 🚀 Key Features

### 🎓 Student Portal
- **Discovery & Filters**: Live search with category pills (Technical, Cultural, Sports, Workshop, Seminar), venue filter, and date ranges.
- **Digital Entry Pass**: Instant scannable QR pass displaying Student Name, Roll Number, Department, Event Date, Venue, and Print/Save action.
- **Auto-Promoted Waitlist**: If capacity is full, students join an automated waitlist queue and are automatically promoted if a seat opens up.
- **Verifiable Participation Certificate**: Instant certificate download with college seal and tamper-proof verification hash.
- **5-Star Feedback**: Post-event student reviews and star ratings.

### 👨‍💼 Organizer Studio
- **Venue Collision Prevention**: Automated clash detection prevents scheduling two events in the same auditorium or lab during the same time slot.
- **Agenda / Schedule Builder**: Add multi-session timelines, keynote speakers, and room details.
- **Live Smartphone Camera QR Scanner**: Organizers can point their phone camera or enter roll numbers at the entrance to check in students with duplicate check-in prevention.
- **Attendee CSV Export**: 1-click download of attendance rosters for faculty submission and duty-leave approvals.

### 🏛️ Admin / Dean Command Center
- **Executive KPIs**: Real-time stats on total events, student registrations, turnout rate (%), and active accounts.
- **Moderation Queue**: Review, Approve, or Reject pending student or club proposals with remarks.
- **Campus Facilities Manager**: Add and manage campus auditoriums, seminar halls, and computer labs.
- **User Role Governance**: Promote students to organizers or administrators.
- **System Audit Trail**: Complete transparency log of all university operations.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Lucide Icons, HTML5-QRCode (Phone camera scanner), Canvas-Confetti, Axios, React Router 7.
- **Backend**: Node.js, Express, MySQL2 Connection Pool, JSON Web Tokens (JWT), BCrypt.js.
- **Database**: MySQL with relational views (`view_event_analytics`), conflict constraints, and relational schema.

---

## 💻 Local Development Setup

### 1. Database Setup
1. Ensure MySQL is running locally.
2. Run the migration script in `backend/`:
   ```bash
   cd backend
   node migrate.js
   ```

### 2. Backend Server
```bash
cd backend
npm install
node server.js
```
Runs on `http://localhost:5000`.

### 3. Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

---

## 🌐 100% Free Cloud Hosting Guide

You can host this entire stack online for free so students and organizers across campus can use it on their phones.

### Step 1: Free MySQL Cloud Database (TiDB Cloud or Aiven)
1. Go to [TiDB Cloud](https://tidbcloud.com/) or [Aiven](https://aiven.io/) and create a free account.
2. Create a free **Serverless MySQL** cluster (Free forever, 5 GB storage).
3. Under Connection Details, copy your `Host`, `User`, `Password`, `Port`, and `Database Name`.
4. In your terminal, run the migration script with your cloud database credentials:
   ```bash
   cd backend
   # Update backend/.env with your cloud DB credentials, then run:
   node migrate.js
   ```

### Step 2: Deploy Backend API (Render.com)
1. Go to [Render.com](https://render.com/) and sign up for free.
2. Click **New +** ➔ **Web Service** ➔ Connect your GitHub repository.
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Under **Environment Variables**, add:
   - `PORT`: `5000`
   - `DB_HOST`: `<your cloud db host>`
   - `DB_USER`: `<your cloud db user>`
   - `DB_PASSWORD`: `<your cloud db password>`
   - `DB_NAME`: `<your cloud db name>`
   - `JWT_SECRET`: `your_secure_jwt_secret_key`
5. Click **Deploy**. Copy your hosted backend URL (e.g. `https://campussync-api.onrender.com`).

### Step 3: Deploy Frontend Web App (Vercel)
1. Go to [Vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **Add New Project** ➔ Import your repository.
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://campussync-api.onrender.com/api` (your Render backend URL with `/api`)
5. Click **Deploy**.
6. Your site will be live on a secure `https://...vercel.app` URL with automatic SSL!

### 📱 Why HTTPS Enables Live Smartphone Camera Scanning
Modern web browsers (Safari on iOS and Chrome on Android) require an **HTTPS** connection to access the device camera. Deploying the frontend to Vercel provides free automatic HTTPS, allowing organizers at the venue door to open the scanner on their mobile phone, grant camera permission, and scan student passes seamlessly!

---

## 👥 Default Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `arun@example.com` | `password123` |
| **Organizer** | `priya@example.com` | `password123` |
| **Campus Admin / Dean** | `admin@example.com` | `admin123` |
