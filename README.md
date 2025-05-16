# REPZ — AI Fitness Social Platform

**Train smarter. Compete harder. Win together.**

---

## 🚀 Overview

REPZ is an AI-powered social fitness platform built for modern lifters, creators, and gyms. It combines:

- 🧠 **AI-generated workouts & meals** — personalized to goals, experience, and injuries
- 🎥 **FormGhost AI** — real-time feedback from form videos
- 🖼️ **Visual Gains AI** — track body transformation from photos
- 🏆 **XP system + daily challenges** — unlock levels and compete in gym leaderboards
- 💰 **Creator tools** — sell plans, earn payouts
- 🔒 **Free, Pro, Elite tiers** — maximize results with your perfect fit

---

## 🧱 Tech Stack

| Layer         | Tech Stack                                   |
| ------------- | -------------------------------------------- |
| **Frontend**  | React Native (Expo SDK)                      |
| **Backend**   | Firebase + Node.js Functions                 |
| **AI Engine** | OpenAI (GPT-3.5) + TensorFlow Pose Detection |
| **Payments**  | Stripe (Web) + RevenueCat (Mobile)           |
| **Database**  | Firebase Firestore                           |
| **Storage**   | Firebase Cloud Storage                       |
| **Hosting**   | Firebase Hosting                             |

---

## 🛠️ Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-org/repz-app.git
cd repz-app
2. Install Dependencies
bash
Copy
Edit
npm install
# or
yarn install
3. Setup .env
Create a .env file in the project root:

env
Copy
Edit
FIREBASE_API_KEY=your_firebase_api_key
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_key
...
See .env.example for the full list of variables.

4. Run the App
bash
Copy
Edit
npx expo start
🗂️ Project Structure
bash
Copy
Edit
repz-app/
├── src/
│   ├── screens/          # User screens (dashboard, profile, etc.)
│   ├── components/       # Reusable UI components
│   ├── api/              # API clients (meals, workouts, form)
│   ├── context/          # Global state (auth, XP, tier)
│   ├── hooks/            # Custom hooks (streaks, timers)
│   ├── utils/            # Shared utilities
│   ├── theme/            # Typography, colors, spacing
│   └── navigation/       # Navigation structure
│
├── backend/              # Server-side logic
│   ├── controllers/      # API route logic
│   ├── firebase/         # Admin Firebase config
│   ├── functions/        # AI logic + XP, summaries
│   └── utils/            # Shared backend utilities
│
├── ai/                   # AI prompts (form, meal, workouts)
├── admin/                # Admin dashboard (user reports, flags)
├── payments/             # Stripe & RevenueCat integrations
├── .env                  # Local environment config
├── app.json              # Expo app configuration
└── README.md             # You’re here!
🔧 Scripts

Script	Description
npm start	Launch Expo dev server
npm run lint	Lint all files with ESLint
npm run build	Build for production (TBD)
npm run format	Prettier formatting
🧪 Testing
Currently no test coverage. Basic unit tests coming soon.

bash
Copy
Edit
npm run test
💬 Contributing
Have an idea or improvement?
Pull Requests and Issues are welcome!

🖼️ Screenshots (Coming Soon)

Dashboard	FormGhost	Visual Gains
✅	📸	🧠
📦 Deployment
Build & deploy with:

bash
Copy
Edit
expo export
Or use EAS Build.

📝 License
© 2025 REPZ — All rights reserved.

yaml
Copy
Edit
```
