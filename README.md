<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
</div>

<h1 align="center">Flash-Cards-Remember</h1>

<div align="center">
  <strong>An elegant, powerful, and intelligent Flashcard ecosystem.</strong><br>
  <em>Developed by <b>Victor Pham</b></em>
</div>

<br />

## 🌟 Overview

**Flash-Cards-Remember** is a modern, feature-rich web application built to supercharge your learning journey. Leveraging the power of Active Recall, gamification, and document parsing, it transforms how you memorize and study information.

## ✨ Key Features

- **🧠 Active Recall & Spaced Repetition**: Study smart with built-in active recall and focused review sessions.
- **🎮 Gamified Learning**: Engage with fun mini-games like *Matching Game* and fast-paced *Speed Quiz*.
- **📄 Document Import**: Seamlessly import your learning materials from PDF documents using AI.
- **📊 Interactive Dashboard**: Track your learning progress, mastery levels, and study streaks over time.
- **🎨 Beautiful UI/UX**: A highly responsive, animated, and accessible interface.

## 🛠️ Tech Stack

- **Frontend Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Framer Motion (for fluid animations)
- **State Management:** Zustand
- **Routing:** React Router v7
- **Icons:** Lucide React

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

Make sure you have Node.js installed. We recommend using **Node 18+**.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone git@github.com-personal:ducthinh17/Flash-Cards-Remember.git
   cd Flash-Cards-Remember
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # Or using bun: bun install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file and add your `GEMINI_API_KEY`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   # Or using bun: bun run dev
   ```

5. **Open your browser** and visit `http://localhost:3000` to see the application in action.

## 📂 Project Structure

```text
src/
├── components/   # Reusable UI components and layout structures
├── lib/          # Utilities (PDF parsing, utilities, API hooks)
├── pages/        # Main application views (Dashboard, Study, Games, Review...)
├── store/        # Zustand state management
└── types/        # TypeScript interfaces and types
```

---

<div align="center">
  Made with ❤️ by <b>Victor Pham</b>
</div>
