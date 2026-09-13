USE college_event_management;


INSERT INTO categories (category_name, description)
VALUES
('Technical', 'Technology and programming events'),
('Cultural', 'Music, dance and cultural events'),
('Sports', 'Sports competitions and tournaments'),
('Workshop', 'Educational and practical workshops'),
('Seminar', 'Academic and professional seminars');

SELECT * FROM categories;

INSERT INTO users (name, email, password, role)
VALUES
('Arun Kumar', 'arun@example.com', 'password123', 'student'),
('Anjali Menon', 'anjali@example.com', 'password123', 'student'),
('Rahul Nair', 'rahul@example.com', 'password123', 'student'),

('Priya Sharma', 'priya@example.com', 'password123', 'organizer'),
('Vikram Das', 'vikram@example.com', 'password123', 'organizer'),

('Admin User', 'admin@example.com', 'admin123', 'admin');

SELECT user_id, name, email, role
FROM users;

INSERT INTO events
(title, description, event_date, location, capacity, category_id, organizer_id)
VALUES
(
    'College Hackathon 2026',
    'A 24-hour coding competition for students.',
    '2026-10-15 09:00:00',
    'Computer Science Block',
    100,
    1,
    4
),
(
    'Cultural Fest',
    'Annual college cultural festival with music and dance.',
    '2026-11-05 10:00:00',
    'Main Auditorium',
    500,
    2,
    4
),
(
    'Football Tournament',
    'Inter-department football tournament.',
    '2026-10-25 08:00:00',
    'College Ground',
    200,
    3,
    5
),
(
    'Web Development Workshop',
    'Learn modern web development fundamentals.',
    '2026-09-20 10:00:00',
    'Seminar Hall',
    50,
    4,
    5
);

SELECT * FROM events;

INSERT INTO registrations (student_id, event_id, status)
VALUES
(1, 1, 'registered'),
(1, 4, 'registered'),
(2, 1, 'registered'),
(2, 2, 'registered'),
(3, 3, 'registered');

SELECT * FROM registrations;

SELECT
    users.name AS student_name,
    events.title AS event_name,
    registrations.status,
    registrations.registration_date
FROM registrations
JOIN users
    ON registrations.student_id = users.user_id
JOIN events
    ON registrations.event_id = events.event_id;
    
 SELECT
    events.title,
    categories.category_name,
    events.event_date,
    events.location
FROM events
JOIN categories
    ON events.category_id = categories.category_id;  
    
    SELECT
    events.title AS event_name,
    users.name AS organizer_name,
    events.event_date
FROM events
JOIN users
    ON events.organizer_id = users.user_id;