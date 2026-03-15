import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Login from './pages/Login.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import ProfessorSignup from './pages/ProfessorSignup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile';
import ELibrary from './pages/ELibrary.jsx';
import VideoLibrary from './pages/VideoLibrary.jsx';
import Quiz from './pages/Quiz.jsx';
import Connect from './pages/Connect.jsx';
import Groups from './pages/Groups.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import ManageUsers from './pages/Admin/ManageUsers.jsx';
import ManageColleges from './pages/Admin/ManageColleges.jsx';
import ManageCourses from './pages/Admin/ManageCourses.jsx';
import ApproveVideos from './pages/Admin/ApproveVideos.jsx';
import TokenHistory from './pages/TokenHistory.jsx';
import Chat from './pages/Chat.jsx';
import Messages from './pages/Messages.jsx';
import ManageProfessors from './pages/Admin/ManageProfessors';
import ProfessorLogin from './pages/ProfessorLogin';
import GroupChat from './pages/GroupChat';
import ProfessorDashboard from './pages/ProfessorDashboard';



/**
 * AppContent component that uses useLocation to enable AnimatePresence.
 * This is separated so that the useLocation hook is inside the Router context.
 */
function AppContent() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/professor/signup" element={<ProfessorSignup />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        {/* Note: The same Profile component handles both own profile and others' profiles */}
        <Route path="/profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/library" element={<PrivateRoute><ELibrary /></PrivateRoute>} />
        <Route path="/videos" element={<PrivateRoute><VideoLibrary /></PrivateRoute>} />
        <Route path="/quiz" element={<PrivateRoute><Quiz /></PrivateRoute>} />
        <Route path="/connect" element={<PrivateRoute><Connect /></PrivateRoute>} />
        <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/chat/:userId" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/token-history" element={<PrivateRoute><TokenHistory /></PrivateRoute>} />

        {/* Admin routes (also protected) */}
        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute><ManageUsers /></PrivateRoute>} />
        <Route path="/admin/colleges" element={<PrivateRoute><ManageColleges /></PrivateRoute>} />
        <Route path="/admin/courses" element={<PrivateRoute><ManageCourses /></PrivateRoute>} />
        <Route path="/admin/videos/pending" element={<PrivateRoute><ApproveVideos /></PrivateRoute>} />
        <Route path="/admin/professors" element={<PrivateRoute><ManageProfessors /></PrivateRoute>} />
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/professor/login" element={<ProfessorLogin />} />
        <Route path="/group/:groupId" element={<PrivateRoute><GroupChat /></PrivateRoute>} />
        <Route path="/professor/dashboard" element={<PrivateRoute><ProfessorDashboard /></PrivateRoute>} />



      </Routes>
    </AnimatePresence>
  );
}

/**
 * Main App component wrapped with AuthProvider and Router.
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;