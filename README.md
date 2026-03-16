
# 📚 StudySnap – Student Social Media & Learning Platform

StudySnap is a full‑stack MERN application designed to integrate academic interaction, study resources, and gamified learning into a single digital ecosystem. Students can connect with classmates, access study materials, participate in quizzes, earn tokens, and even scan their college ID for rewards. Professors have a dedicated dashboard to upload lecture videos (pending admin approval) and manage their courses. Administrators oversee users, content, and approvals.

---

## ✨ Features

### 👨‍🎓 For Students
- **OTP‑based login** (demo OTP: `123456`) – no password needed.
- **Daily check‑in** – earn 10 tokens and maintain streaks.
- **ID card scanning** – earn tokens (max 2 scans/day, token amount depends on time gap). Supports both QR and 1D barcodes.
- **Quizzes** – test your knowledge and earn tokens.
- **E‑Library** – upload and browse PDF study materials (filtered by college).
- **Video lectures** – watch professor‑approved videos.
- **Connect with classmates** – search users, send/accept connection requests.
- **Real‑time messaging** (polling) – chat with connected friends, share PDFs.
- **Study groups** – create or join groups, group chat with file sharing.
- **Token transaction history** – view your earnings.
- **Activity feed** – see your recent actions.

### 👨‍🏫 For Professors
- **Professor‑specific signup** (awaits admin approval).
- **Professor dashboard** – upload video lectures (file upload, max 100MB).
- **View uploaded videos** with approval status (pending/approved/rejected).
- **Edit profile** – update name and courses you teach.

### 🛡️ For Admins
- **Admin login** (email/password).
- **Dashboard** with platform statistics.
- **Manage students** – view, filter by college/course, delete, send notifications.
- **Manage professors** – approve/reject new professors, delete.
- **Manage colleges & courses** – full CRUD.
- **Approve videos** – review professor‑uploaded videos before they become visible to students.

### 🎨 UI/UX Highlights
- Glassmorphism design with animated backgrounds (`DarkVeil`) and click‑spark effects.
- Fully responsive – works on mobile, tablet, and desktop.
- Smooth page transitions and animations (Framer Motion).

---

## 🛠️ Tech Stack

| Area       | Technology                                                                 |
|------------|----------------------------------------------------------------------------|
| Frontend   | React, React Router, Vite, Tailwind CSS, Framer Motion, Axios              |
| Backend    | Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, multer                 |
| Database   | MongoDB (local or Atlas)                                                   |
| Barcode    | `html5-qrcode` (supports QR & 1D codes), `@zxing/library` (fallback)      |
| Deployment | Backend → Render, Frontend → Vercel, Database → MongoDB Atlas              |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- MongoDB (local or Atlas)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/waseem-siddique/studysnap.git
cd studysnap
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder with the following variables:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/studysnap
JWT_SECRET=your_secret_key
```

Start the backend:
```bash
npm start
```
The server will run at `http://localhost:5000`.

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## 🌐 Deployment

### Backend (Render)
1. Push your code to GitHub.
2. Create a **Web Service** on Render, connect your repository.
3. Set the **Root Directory** to the repository root (where your root `package.json` is).
4. Use the following build command:
   ```bash
   npm run install-backend && npm run install-frontend && npm run build-frontend
   ```
5. Set the **Start Command**:
   ```bash
   npm start
   ```
6. Add environment variables (same as local `.env` plus any production‑specific ones).
7. Deploy – your backend will be available at `https://your-app.onrender.com`.

### Frontend (Vercel)
1. Import your GitHub repository into Vercel.
2. Set the **Root Directory** to `frontend`.
3. Add environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com/api
   ```
4. Deploy – your frontend will be available at `https://your-app.vercel.app`.

### Database (MongoDB Atlas)
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Get your connection string, replace `MONGO_URI` in your environment variables.
3. Whitelist all IPs (`0.0.0.0/0`) for Render (or use a more secure method).

---

## 🔑 Environment Variables

### Backend (`.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/studysnap?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key
```

### Frontend (`.env` / Vercel)
```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

---

## 📁 Project Structure

```
studysnap/
├── backend/
│   ├── models/           # Mongoose models
│   ├── routes/           # Express route handlers
│   ├── middleware/       # Auth & admin middleware
│   ├── uploads/          # Uploaded files (videos, chat files)
│   ├── .env              # Environment variables (local)
│   ├── server.js         # Entry point
│   └── package.json
├── frontend/
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── components/   # Reusable UI components (Logo, Background, etc.)
│   │   ├── context/      # Auth context
│   │   ├── pages/        # All page components (Dashboard, Profile, etc.)
│   │   ├── config.js     # API base URL configuration
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env              # Vite environment variables (local)
│   ├── vite.config.js    # Vite configuration
│   └── package.json
├── package.json          # Root package.json (for Render build)
└── README.md             # This file
```

---

## 🧪 Testing Locally

1. Start MongoDB locally (or use Atlas).
2. Run backend: `cd backend && npm start`
3. Run frontend: `cd frontend && npm run dev`
4. Open `http://localhost:5173`

**Demo credentials:**
- **Student**: any mobile, OTP `123456`
- **Professor**: create an account (awaits admin approval)
- **Admin**: email `admin@studysnap.com`, password `admin123`

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is for educational purposes as part of a B.Tech mini project. No formal license is applied.

---

## 🙌 Acknowledgements

- Thanks to all the open‑source libraries that made this project possible.
- Special thanks to the teaching staff for guidance.

---

**Happy Learning!** 🎓
```
