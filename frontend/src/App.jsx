import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
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
import AdminLogin from './pages/AdminLogin';
import ProfessorSignup from './pages/ProfessorSignup';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/library" element={
              <PrivateRoute>
                <ELibrary />
              </PrivateRoute>
            } />
            <Route path="/videos" element={
              <PrivateRoute>
                <VideoLibrary />
              </PrivateRoute>
            } />
            <Route path="/quiz" element={
              <PrivateRoute>
                <Quiz />
              </PrivateRoute>
            } />
            <Route path="/connect" element={
              <PrivateRoute>
                <Connect />
              </PrivateRoute>
            } />
            <Route path="/groups" element={
              <PrivateRoute>
                <Groups />
              </PrivateRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin" element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/admin/users" element={
              <PrivateRoute>
                <ManageUsers />
              </PrivateRoute>
            } />
            <Route path="/admin/colleges" element={
              <PrivateRoute>
                <ManageColleges />
              </PrivateRoute>
            } />
            <Route path="/admin/courses" element={
              <PrivateRoute>
                <ManageCourses />
              </PrivateRoute>
            } />
            <Route path="/admin/videos/pending" element={
              <PrivateRoute>
                <ApproveVideos />
              </PrivateRoute>
            } />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/professor/signup" element={<ProfessorSignup />} />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;