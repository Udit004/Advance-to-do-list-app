# 🚀 Advanced Todo List App

<div align="center">

![Todo App Banner](https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-Authentication-orange?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI-Gemini%20Powered-blue?style=for-the-badge)
![ML Model](https://img.shields.io/badge/ML-Flask%20Prediction-red?style=for-the-badge)

**A feature-rich, AI-powered task management application with real-time notifications and intelligent task prioritization.**

[Live Demo](https://advance-to-do-list-app.vercel.app) | [Report Bug](https://github.com/Udit004/Advance-to-do-list-app/issues) | [Request Feature](https://github.com/Udit004/Advance-to-do-list-app/issues)

</div>

---

## ✨ Features

### 🎯 Core Functionality
- **Smart Task Management** - Create, update, delete, and organize tasks effortlessly
- **AI-Powered Task Generation** - Leverage Google's Gemini API to auto-generate tasks
- **Intelligent Priority Prediction** - ML model predicts task priority based on content and context
- **Real-time Notifications** - Socket.IO powered in-app notifications for instant updates
- **Secure Authentication** - Firebase-based user authentication with multiple sign-in options
- **State Management** - Efficient state handling with Zustand for optimal performance

### 🎨 User Experience
- **Modern UI** - Beautiful, responsive interface built with React and TailwindCSS
- **Dark/Light Mode** - Seamless theme switching for comfortable viewing
- **Form Validation** - React Hook Form with Zod schema validation
- **Smooth Animations** - Framer Motion powered transitions and interactions
- **Toast Notifications** - User-friendly feedback with React Hot Toast

### 🔧 Technical Highlights
- **Progressive Web App (PWA)** - Install and use offline capabilities
- **Cloud Image Storage** - Cloudinary integration for media management
- **Email Notifications** - Automated email reminders with Nodemailer
- **Payment Integration** - Razorpay payment gateway (if premium features available)
- **Scheduled Tasks** - Node-cron for automated background jobs

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** TailwindCSS 4, DaisyUI, Bootstrap 5
- **State Management:** Zustand
- **Routing:** React Router DOM v7
- **Forms:** React Hook Form + Zod validation
- **Animations:** Framer Motion
- **Real-time:** Socket.IO Client
- **Icons:** Lucide React, Bootstrap Icons
- **UI Components:** Radix UI (Dialog, Label, Tooltip, etc.)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js 5
- **Database:** MongoDB with Mongoose
- **Authentication:** Firebase Admin SDK
- **Real-time:** Socket.IO
- **File Upload:** Multer + Cloudinary
- **Email Service:** Nodemailer
- **Scheduled Jobs:** Node-cron
- **Push Notifications:** Web-push

### Machine Learning
- **Framework:** Flask (Python)
- **Model:** Task priority prediction model
- **Deployment:** Render
- **Integration:** REST API for predictions

### AI Integration
- **Google Gemini API** - Natural language task generation

---

## 🏗️ Architecture

```
Advance-to-do-list-app/
├── frontend/                 # React frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/                  # Express.js backend server
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   ├── middleware/
│   └── package.json
├── task-priority-api/        # Flask ML model API
│   ├── app. py
│   ├── model/
│   └── requirements. txt
├── render.yaml              # Render deployment config
└── runtime.txt              # Python runtime version
```

---

## 🚀 Getting Started

### Prerequisites
- Node. js (v16 or higher)
- Python 3.11+
- MongoDB Atlas account or local MongoDB
- Firebase project
- Google Gemini API key
- Cloudinary account

### Environment Variables

#### Frontend (. env)
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
FIREBASE_SERVICE_ACCOUNT=path_to_firebase_service_account. json
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
ML_API_URL=your_flask_ml_api_url
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

#### ML API (.env)
```env
FLASK_ENV=production
MODEL_PATH=./model/task_priority_model.pkl
```

---

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Udit004/Advance-to-do-list-app.git
cd Advance-to-do-list-app
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Setup Backend
```bash
cd ../backend
npm install
npm run dev
```

### 4. Setup ML API
```bash
cd ../task-priority-api
pip install -r requirements.txt
python app.py
```

The application will run on: 
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000
- **ML API:** http://localhost:8000 (or as configured)

---

## 🌐 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy with one click

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your repository
3. Configure environment variables
4. Set build command:  `cd backend && npm install`
5. Set start command: `npm start`

### ML API (Render)
1. Create a new Web Service
2. Select Python environment
3. Configure build and start commands as per `render.yaml`

---

## 📱 Features Walkthrough

### 1️⃣ **Smart Task Creation**
- Manually create tasks with title, description, deadline, and priority
- Use AI to generate task suggestions based on your input
- Auto-categorize tasks with ML-powered priority prediction

### 2️⃣ **Real-time Collaboration**
- Receive instant notifications when tasks are updated
- Socket.IO ensures seamless real-time communication
- Share tasks and collaborate with team members

### 3️⃣ **Intelligent Organization**
- Filter tasks by status, priority, and deadline
- Search functionality for quick task retrieval
- Visual indicators for task urgency

### 4️⃣ **Secure & Reliable**
- Firebase authentication ensures data security
- MongoDB provides robust data persistence
- Cloud backups and data recovery

---

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**. 

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Udit**

- GitHub: [@Udit004](https://github.com/Udit004)
- Project Link: [https://github.com/Udit004/Advance-to-do-list-app](https://github.com/Udit004/Advance-to-do-list-app)
- Live Demo: [https://advance-to-do-list-app.vercel.app](https://advance-to-do-list-app. vercel.app)

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Express. js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Firebase](https://firebase.google.com/)
- [Google Gemini API](https://ai.google.dev/)
- [Socket.IO](https://socket.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)
- [Render](https://render.com/)

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

Made with ❤️ by Udit

</div>
