CREATE DATABASE college_event_management;
USE college_event_management;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'organizer', 'admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location VARCHAR(150) NOT NULL,
    capacity INT NOT NULL,
    
    category_id INT NOT NULL,
    organizer_id INT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id)
        REFERENCES categories(category_id),
        
    FOREIGN KEY (organizer_id)
        REFERENCES users(user_id)
);


CREATE TABLE registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    
    student_id INT NOT NULL,
    event_id INT NOT NULL,
    
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    status ENUM('registered', 'cancelled')
        DEFAULT 'registered',
    
    FOREIGN KEY (student_id)
        REFERENCES users(user_id),
        
    FOREIGN KEY (event_id)
        REFERENCES events(event_id),
        
    UNIQUE(student_id, event_id)
);


SHOW TABLES;

DESCRIBE users;

