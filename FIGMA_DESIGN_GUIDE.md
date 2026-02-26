# SmartStudy - Figma Design Guide

This document provides comprehensive design specifications for creating a Figma prototype for the SmartStudy application.

---

## 📋 Figma Project Overview

**Project Name**: SmartStudy - AI-Assisted Adaptive Study Planner  
**Type**: Web Application (Responsive)  
**Target Users**: Students, School Admins, Super Admins  
**Design System**: Modern, clean, academic-focused with AI elements  
**Color Palette**: Blue primary (#2563eb), Indigo accent (#4f46e5), White backgrounds, Gray tones

---

## 🎨 Color System

### Primary Colors

| Name               | Hex Code | Usage                        |
| ------------------ | -------- | ---------------------------- |
| Primary Blue       | #2563eb  | Main buttons, links, accents |
| Primary Blue Dark  | #1d4ed8  | Hover states                 |
| Primary Blue Light | #3b82f6  | Highlights, badges           |
| Indigo             | #4f46e5  | Gradients, premium elements  |
| Indigo Dark        | #4338ca  | Gradient endpoints           |

### Semantic Colors

| Name           | Hex Code | Usage                                     |
| -------------- | -------- | ----------------------------------------- |
| Success Green  | #22c55e  | High scores (80%+), positive trends       |
| Warning Yellow | #eab308  | Medium scores (60-79%), medium difficulty |
| Danger Red     | #ef4444  | Low scores (<60%), high difficulty        |
| Orange         | #f97316  | Very low scores (<40%)                    |

### Neutral Colors

| Name     | Hex Code | Usage                            |
| -------- | -------- | -------------------------------- |
| White    | #ffffff  | Card backgrounds                 |
| Gray 50  | #f9fafb  | Page backgrounds                 |
| Gray 100 | #f3f4f6  | Card borders, subtle backgrounds |
| Gray 200 | #e5e7eb  | Dividers                         |
| Gray 400 | #9ca3af  | Placeholder text                 |
| Gray 600 | #4b5563  | Secondary text                   |
| Gray 900 | #111827  | Primary text, headings           |

### Difficulty Level Colors

| Level      | Color  | Hex     |
| ---------- | ------ | ------- |
| Easy (1-2) | Green  | #22c55e |
| Medium (3) | Yellow | #eab308 |
| Hard (4-5) | Red    | #ef4444 |

---

## 📱 Page Structure (Frames to Create in Figma)

### 1. Landing Page (1920x1080)

**Purpose**: Marketing page for new users

#### Navigation Bar (Fixed)

- Logo (left): "S" icon + "SmartStudy" text
- Nav links (center): Features, How It Works, Pricing
- CTAs (right): "Sign In" (ghost button), "Get Started Free" (primary gradient)

#### Hero Section

- Headline: "Study smarter with adaptive schedules and clear progress insights"
- Subtext: Brief value proposition
- 3-step bullet list
- Hero image (right side): Students studying
- Stats bar below: 4 cards (35% Improvement, 2.5x Efficiency, 500+ Students, 95% Satisfaction)

#### Features Section

- Section title: "Everything you need to succeed"
- 6 feature cards in 3x2 grid:
  1. Adaptive Study Planning (tune icon)
  2. Performance Tracking (insights icon)
  3. Academic Path Recommendations (school icon)
  4. Real-time Adaptation (autorenew icon)
  5. Career Direction Insights (psychology icon)
  6. Secure and Private (verified_user icon)
- Feature image at bottom

#### How It Works Section

- 4 numbered steps in horizontal layout:
  1. Create account
  2. Add subjects
  3. Track scores
  4. Follow schedule

#### Pricing Section

- 3 pricing cards:
  - Basic (Free): 5 subjects, basic planning, tracking
  - Premium ($9.99): Unlimited, analytics, support, export
  - School ($2/student): Full integration, admin dashboard

#### CTA Section

- Gradient background (blue to indigo)
- Headline + subtext
- "Get Started Free" button (white)

#### Footer

- 4 columns: Brand, Product, Account, Contact
- Copyright at bottom

---

### 2. Login/Register Page (1920x1080)

**Purpose**: Authentication

#### Layout

- Split screen: Left (decorative image), Right (form)
- Logo at top

#### Login Form

- "Welcome Back" heading
- Email input field
- Password input field
- "Remember me" checkbox + "Forgot password?" link
- "Sign In" button (primary)
- "Don't have an account? Sign up" link

#### Register Form (similar layout)

- "Create Account" heading
- Name input
- Email input
- Password input
- Confirm password input
- "Sign Up" button (primary)
- "Already have an account? Sign in" link

---

### 3. Student Dashboard (1920x1080)

**Purpose**: Main application for students

#### Sidebar (Fixed Left, 280px)

- Logo + collapse button
- User avatar + name + role badge
- Navigation menu:
  - Overview (grid icon)
  - Subjects (book icon)
  - Study Plan (calendar icon)
  - Analytics (bar_chart icon) - Premium only
  - Profile (person icon)
- "Logout" button at bottom

#### Header (Top)

- Page title
- Search bar (optional)
- Notification bell
- User dropdown menu

#### Overview View

- **Statistics Cards** (4 columns):
  1. Total subjects, plan count, hours, average score
  2. Highest/Lowest/Range performance
  3. Top 3 performers
  4. Quick actions

- **School Admin Comments** section

#### Subjects View

- "Add Subject" button
- Subject cards grid:
  - Subject name
  - Difficulty badge (color-coded 1-5)
  - Exam date
  - Latest score
  - Action buttons: View Details, Edit, Delete
- Subject count indicator

#### Study Plan View

- "Generate Study Plan" button
- Current week indicator
- Study plan cards:
  - Subject name
  - Hours allocated (progress bar)
  - Percentage of weekly budget
- Total hours summary (X / 35h budget)

#### Analytics View (Premium)

- Academic Recommendation card
- Performance breakdown charts
- Trend analysis

#### Profile View

- User info card
- Edit profile form
- Plan information

---

### 4. Modals (to design as components)

#### Add/Edit Subject Modal

- Modal title: "Add Subject" / "Edit Subject"
- Form fields:
  - Subject name (text input)
  - Difficulty (1-5 buttons with colors)
  - Exam date (date picker)
- Cancel / Save buttons

#### Log Performance Modal

- Subject dropdown selector
- Score slider (0-100)
- Week number (auto-filled)
- Cancel / Log button

#### Subject Detail Modal

- Subject header (name, difficulty badge)
- Performance history table:
  - Week #, Score, Date, Trend indicator
- Performance trend (Improving 📈 / Declining 📉)
- Close button

#### Academic Recommendation Modal

- Recommended path (STEM/Humanities/Business)
- Reasoning text
- Subject area breakdown (progress bars):
  - STEM: XX%
  - Humanities: XX%
  - Business: XX%
- Tips section
- Close button

---

### 5. Admin Dashboard (1920x1080)

**Purpose**: School administration

#### Additional Sidebar Items

- Students
- All Subjects
- Performance Reports
- Settings

#### Students View

- Student list table:
  - Avatar, Name, Email, Subjects count, Avg score
  - Actions: View, Edit
- Add student button
- Filters/search

#### Performance Reports View

- School-wide statistics
- Student performance comparison
- Export options

---

### 6. Super Admin Dashboard (1920x1080)

**Purpose**: Platform administration

#### Additional Features

- Schools management
- User management
- Platform analytics
- System settings

---

## 🧩 Component Library (Figma Components)

### Buttons

- Primary Button (gradient blue-indigo)
- Secondary Button (gray)
- Ghost Button (transparent)
- Danger Button (red)
- Icon Button (circle with icon)

### Form Elements

- Text Input (with label, placeholder, error state)
- Password Input (with show/hide toggle)
- Dropdown Select
- Date Picker
- Slider (for score 0-100)
- Checkbox
- Toggle Switch

### Cards

- Subject Card
- Statistics Card
- Pricing Card
- Feature Card
- Step Card

### Badges

- Difficulty Badge (color-coded)
- Score Badge (color-coded)
- Role Badge (Student/Admin/Super Admin)
- Status Badge (Active/Inactive)

### Progress Indicators

- Linear Progress Bar (for study hours)
- Circular Progress (optional)
- Trend Arrow (up/down)

### Modals

- Standard Modal (with header, body, footer)
- Confirmation Dialog
- Form Modal

### Navigation

- Sidebar Menu Item
- Tab Bar
- Breadcrumbs

### Data Display

- Data Table
- List Item
- Empty State

---

## 📐 Typography

| Element | Font  | Weight         | Size |
| ------- | ----- | -------------- | ---- |
| H1      | Inter | Bold (700)     | 48px |
| H2      | Inter | Bold (700)     | 36px |
| H3      | Inter | SemiBold (600) | 24px |
| H4      | Inter | SemiBold (600) | 20px |
| Body    | Inter | Regular (400)  | 16px |
| Small   | Inter | Regular (400)  | 14px |
| Caption | Inter | Medium (500)   | 12px |

---

## 🎭 States to Design

### Button States

- Default
- Hover (slight scale + shadow)
- Active/Pressed
- Disabled (50% opacity)
- Loading (with spinner)

### Input States

- Default
- Focus (blue border ring)
- Error (red border + error message)
- Disabled

### Card States

- Default
- Hover (lift effect, shadow increase)

---

## 📏 Spacing System (8pt Grid)

| Name | Value |
| ---- | ----- |
| xs   | 4px   |
| sm   | 8px   |
| md   | 16px  |
| lg   | 24px  |
| xl   | 32px  |
| 2xl  | 48px  |
| 3xl  | 64px  |

---

## 🌐 Responsive Breakpoints

| Name    | Width           | Layout                 |
| ------- | --------------- | ---------------------- |
| Mobile  | < 640px         | Single column, stacked |
| Tablet  | 640px - 1024px  | 2 columns              |
| Desktop | 1024px - 1440px | Full layout            |
| Wide    | > 1440px        | Max-width container    |

---

## 🎨 Design Tips for Figma

1. **Use Auto Layout**: Set up all frames with auto layout for easy responsiveness
2. **Create Variants**: Use component variants for different states (hover, focus, etc.)
3. **Style Variables**: Define colors, text styles as Figma variables
4. **Icon Library**: Use Material Symbols or similar icon library
5. **Prototyping**: Set up click-through prototypes for user testing

---

## 📝 Figma File Structure Recommendation

```
SmartStudy Design/
├── 1. Design System/
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Icons
├── 2. Components/
│   ├── Buttons
│   ├── Forms
│   ├── Cards
│   ├── Badges
│   ├── Modals
│   └── Navigation
├── 3. Pages/
│   ├── Landing Page/
│   ├── Login/
│   ├── Register/
│   ├── Student Dashboard/
│   │   ├── Overview
│   │   ├── Subjects
│   │   ├── Study Plan
│   │   ├── Analytics
│   │   └── Profile
│   ├── Admin Dashboard/
│   └── Super Admin Dashboard/
└── 4. Prototypes/
    ├── Student Flow
    └── Admin Flow
```

---

## 🚀 Next Steps

1. Create Figma account (if not already)
2. Set up new project with the structure above
3. Import color palette and typography
4. Build component library
5. Design each page
6. Set up prototypes
7. Share for feedback

---

_This guide was created to help you build a complete Figma design for the SmartStudy project. The design specifications are based on the existing React implementation._
