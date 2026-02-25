# SmartStudy - AI-Assisted Adaptive Study Planner

SmartStudy is an AI-assisted academic support platform that helps students optimize their study planning through adaptive study allocation and provides academic path recommendations.

## AI Integration

SmartStudy integrates Artificial Intelligence to:

- Generate adaptive and personalized study plans 📅
- Recommend academic pathways (A' Level combinations and university faculties) 🎓
- Analyze student performance and identify weak subjects 📊
- Automatically adjust study hours based on progress and exam urgency ⚙️
- Provide intelligent academic guidance and decision support for students and schools 🤖
- Predict suitable career and education directions based on results 🔎

Notes:
- Current implementation is hybrid: rule-based recommendation/analytics with optional OpenAI-enhanced recommendation reasoning.
- Career-direction prediction is currently guidance-oriented and should be treated as advisory support, not deterministic prediction.

## Features

- **User Authentication**: Register and login functionality with JWT tokens
- **Subject Management**: Add, edit, and delete subjects with difficulty levels (1-5) and exam dates
- **Subject Performance Tracking**: View detailed performance history per subject with trends
- **Adaptive Study Engine**: Dynamically allocates study hours based on:
  - Exam urgency (within 14 days = 1.5x multiplier)
  - Subject performance level (lower scores = more study time)
  - Subject difficulty (1-5 scale)
  - Weekly performance feedback
- **Performance Trends**: Track improving or declining trends with visual indicators
- **Performance Analytics**: Statistics dashboard showing:
  - Average performance across all subjects
  - Highest and lowest performing subjects
  - Performance range analysis
  - Top 3 performers list
- **Study Plan Generation**: Intelligent study hour allocation with visual progress bars
- **Academic Path Recommendation**: Rule-based recommendations for STEM, Humanities, or Business paths
- **Enhanced Dashboard**:
  - Statistics overview cards
  - Subject management with edit/delete functionality
  - Current week study plan with time allocation breakdown
  - Subject detail view with performance history
  - Algorithm transparency showing allocation percentages
- **Color-Coded UI**:
  - Difficulty levels (Green/Yellow/Red)
  - Performance scores (Green/Yellow/Orange/Red)
  - Visual progress bars for all metrics

## Project Structure

```
smart_study/
├── backend/
│   ├── config/
│   │   ├── db.js           # Database connection
│   │   └── initDb.js       # Database initialization
│   ├── middleware/
│   │   └── auth.js         # JWT authentication
│   ├── routes/
│   │   ├── auth.js                    # Register/Login
│   │   ├── subjects.js               # Subject CRUD
│   │   ├── studyPlan.js             # Study plan generation
│   │   ├── performance.js           # Performance logging
│   │   ├── academicRecommendation.js # Academic path recommendation
│   │   └── dashboard.js             # Dashboard data
│   ├── server.js           # Main entry point
│   ├── database.sql        # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js
│   │   │   └── Login.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### Backend Setup

1. Navigate to the backend directory:

```
bash
   cd backend

```

2. Install dependencies:

```
bash
   npm install

```

3. Create a `.env` file in the backend directory:

```
env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=smartstudy
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4.1-mini
   # Optional override, usually keep default:
   # OPENAI_BASE_URL=https://api.openai.com/v1/chat/completions

```

4. Create the database:

```
bash
   createdb smartstudy

```

5. Start the server:

```bash
   npm run dev

```

The server will start on port 5000 and automatically create all database tables.

### Frontend Setup

1. Navigate to the frontend directory:

```
bash
   cd frontend

```

2. Install dependencies:

```
bash
   npm install

```

3. Start the development server:

```
bash
   npm run dev

```

The frontend will start on port 5173 (default Vite port).

## API Endpoints

### Authentication

| Method | Endpoint        | Description             |
| ------ | --------------- | ----------------------- |
| POST   | `/api/register` | Register a new user     |
| POST   | `/api/login`    | Login and get JWT token |

**Request Body (Register):**

```
json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Request Body (Login):**

```
json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Subjects

| Method | Endpoint            | Description               |
| ------ | ------------------- | ------------------------- |
| GET    | `/api/subjects`     | Get all subjects for user |
| POST   | `/api/subjects`     | Create a new subject      |
| PUT    | `/api/subjects/:id` | Update a subject          |
| DELETE | `/api/subjects/:id` | Delete a subject          |

**Request Body (Create/Update):**

```
json
{
  "name": "Mathematics",
  "difficulty": 4,
  "exam_date": "2024-06-15"
}
```

### Study Plan

| Method | Endpoint                      | Description                      |
| ------ | ----------------------------- | -------------------------------- |
| POST   | `/api/study-plan/generate`    | Generate adaptive study plan     |
| GET    | `/api/study-plan/:weekNumber` | Get study plan for specific week |

**Request Body (Generate):**

```
json
{
  "week_number": 1
}
```

### Performance

| Method | Endpoint                              | Description                          |
| ------ | ------------------------------------- | ------------------------------------ |
| GET    | `/api/performance`                    | Get all performance logs             |
| POST   | `/api/performance`                    | Log a performance score              |
| GET    | `/api/performance/subject/:subjectId` | Get performance for specific subject |

**Request Body (Log):**

```
json
{
  "subject_id": 1,
  "score": 85,
  "week_number": 1
}
```

### Academic Recommendation

| Method | Endpoint                       | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| GET    | `/api/academic-recommendation` | Get academic path recommendation |

By default, recommendations use the rule engine. If `OPENAI_API_KEY` is set, the backend calls OpenAI to refine `recommended_path` and `reasoning`, while still returning the same response shape and preserving a rule-based fallback when AI is unavailable.

Current recommendation response also includes:
- `ai_insights.weak_subjects`
- `ai_insights.study_hour_adjustments`
- `ai_insights.alevel_combinations`
- `ai_insights.university_faculties`
- `ai_insights.career_directions`
- `ai_insights.school_decision_support`
- `model_source` (`openai` or `rule_engine`)

### Dashboard

| Method | Endpoint         | Description        |
| ------ | ---------------- | ------------------ |
| GET    | `/api/dashboard` | Get dashboard data |

## Adaptive Study Algorithm

The study plan generation uses the following formula:

```
javascript
baseHours = totalWeeklyHours / numberOfSubjects

performanceMultiplier = 2 - (latestScore / 100)
difficultyMultiplier = difficulty / 3
urgencyMultiplier = daysUntilExam < 14 ? 1.5 : 1

allocatedHours = baseHours * performanceMultiplier * difficultyMultiplier * urgencyMultiplier
```

- **Performance**: Lower scores get more study time
- **Difficulty**: Harder subjects get more time
- **Urgency**: Exams within 2 weeks get 1.5x time

## Database Schema

### Users

| Column     | Type         | Description        |
| ---------- | ------------ | ------------------ |
| user_id    | SERIAL       | Primary key        |
| name       | VARCHAR(255) | User's full name   |
| email      | VARCHAR(255) | Unique email       |
| password   | VARCHAR(255) | Hashed password    |
| created_at | TIMESTAMP    | Creation timestamp |

### Subjects

| Column     | Type         | Description           |
| ---------- | ------------ | --------------------- |
| subject_id | SERIAL       | Primary key           |
| user_id    | INTEGER      | Foreign key to Users  |
| name       | VARCHAR(255) | Subject name          |
| difficulty | INTEGER      | 1-5 difficulty rating |
| exam_date  | DATE         | Exam date             |

### StudyPlans

| Column      | Type    | Description             |
| ----------- | ------- | ----------------------- |
| plan_id     | SERIAL  | Primary key             |
| subject_id  | INTEGER | Foreign key to Subjects |
| hours       | INTEGER | Allocated study hours   |
| week_number | INTEGER | Week number             |

### PerformanceLogs

| Column      | Type    | Description             |
| ----------- | ------- | ----------------------- |
| log_id      | SERIAL  | Primary key             |
| subject_id  | INTEGER | Foreign key to Subjects |
| score       | INTEGER | 0-100 score             |
| week_number | INTEGER | Week number             |

### AcademicRecommendations

| Column            | Type         | Description          |
| ----------------- | ------------ | -------------------- |
| recommendation_id | SERIAL       | Primary key          |
| user_id           | INTEGER      | Foreign key to Users |
| recommended_path  | VARCHAR(255) | Recommended path     |
| reasoning         | TEXT         | Explanation          |

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Authentication**: JWT

## License

ISC
