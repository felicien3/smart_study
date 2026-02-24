const pool = require("./db");

const initDb = async () => {
  try {
    // Create Schools table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS Schools (
                school_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                address VARCHAR(255),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    console.log("Schools table created successfully");

    // Create Users table with roles
    await pool.query(`
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
            )
        `);
    console.log("Users table created successfully");

    // Ensure phone column exists for databases created before this field was added.
    await pool.query(`
            ALTER TABLE Users
            ADD COLUMN IF NOT EXISTS phone VARCHAR(30)
        `);

    // Create Subjects table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS Subjects (
                subject_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5) DEFAULT 3,
                exam_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    console.log("Subjects table created successfully");

    // Create StudyPlans table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS StudyPlans (
                plan_id SERIAL PRIMARY KEY,
                subject_id INTEGER REFERENCES Subjects(subject_id) ON DELETE CASCADE,
                hours INTEGER NOT NULL,
                week_number INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    console.log("StudyPlans table created successfully");

    // Create PerformanceLogs table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS PerformanceLogs (
                log_id SERIAL PRIMARY KEY,
                subject_id INTEGER REFERENCES Subjects(subject_id) ON DELETE CASCADE,
                score INTEGER CHECK (score >= 0 AND score <= 100),
                week_number INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    console.log("PerformanceLogs table created successfully");

    // Create AcademicRecommendations table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS AcademicRecommendations (
                recommendation_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
                recommended_path VARCHAR(255),
                reasoning TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    console.log("AcademicRecommendations table created successfully");

    // Create PerformanceComments table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS PerformanceComments (
                comment_id SERIAL PRIMARY KEY,
                log_id INTEGER REFERENCES PerformanceLogs(log_id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
                school_admin_id INTEGER REFERENCES Users(user_id) ON DELETE SET NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    console.log("PerformanceComments table created successfully");

    console.log("All tables created successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

module.exports = initDb;
