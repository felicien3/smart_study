-- SmartStudy Database Schema with User Roles

-- Schools table (for Super Admin to manage)
CREATE TABLE IF NOT EXISTS Schools (
    school_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table with roles
CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    school_id INTEGER REFERENCES Schools(school_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT role_check CHECK (role IN ('super_admin', 'school_admin', 'student'))
);

-- Subjects table
CREATE TABLE IF NOT EXISTS Subjects (
    subject_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5) DEFAULT 3,
    exam_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- StudyPlans table
CREATE TABLE IF NOT EXISTS StudyPlans (
    plan_id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES Subjects(subject_id) ON DELETE CASCADE,
    hours INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PerformanceLogs table
CREATE TABLE IF NOT EXISTS PerformanceLogs (
    log_id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES Subjects(subject_id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    week_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AcademicRecommendations table
CREATE TABLE IF NOT EXISTS AcademicRecommendations (
    recommendation_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    recommended_path VARCHAR(255),
    reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance comments from School Admins to students
CREATE TABLE IF NOT EXISTS PerformanceComments (
    comment_id SERIAL PRIMARY KEY,
    log_id INTEGER REFERENCES PerformanceLogs(log_id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    school_admin_id INTEGER REFERENCES Users(user_id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing

-- Sample Super Admin (password: password123)
INSERT INTO Users (name, email, password, role) VALUES 
('Super Admin', 'admin@smartstudy.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');

-- Sample School
INSERT INTO Schools (name, email, address) VALUES 
('Sample High School', 'school@smartstudy.com', '123 Education St');

-- Sample School Admin (password: password123)
INSERT INTO Users (name, email, password, role, school_id) VALUES 
('School Admin', 'schooladmin@smartstudy.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'school_admin', 1);
--Email: admin@smartstudy.com
--Password: Admin#2026

-- Sample Student (password: password123)
INSERT INTO Users (name, email, password, role, school_id) VALUES 
('Test Student', 'student@smartstudy.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 1);

-- Sample Subjects for student
INSERT INTO Subjects (user_id, name, difficulty, exam_date) VALUES 
(3, 'Mathematics', 4, '2024-06-15'),
(3, 'Physics', 3, '2024-06-20'),
(3, 'Chemistry', 3, '2024-06-18'),
(3, 'Biology', 2, '2024-06-22');
