import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    college: '',
    course: ''
  });
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        college: user.college?._id || '',
        course: user.course?._id || ''
      });
    }
    fetchColleges();
  }, [user]);

  const fetchColleges = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/colleges');
      setColleges(res.data);
    } catch (err) {
      console.error('Failed to fetch colleges');
    }
  };

  const fetchCourses = async (collegeId) => {
    if (!collegeId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/courses?college=${collegeId}`);
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to fetch courses');
    }
  };

  useEffect(() => {
    if (formData.college) {
      fetchCourses(formData.college);
    }
  }, [formData.college]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'college') {
      setFormData(prev => ({ ...prev, course: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.put('http://localhost:5000/api/users/profile', {
        name: formData.name,
        college: formData.college,
        course: formData.course
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 animate-gradient-xy">
      {/* Animated blobs */}
      <div className="fixed w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 -left-10 pointer-events-none"></div>
      <div className="fixed w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-0 right-0 pointer-events-none"></div>
      <div className="fixed w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 bottom-20 left-20 pointer-events-none"></div>

      {/* Navbar with Home button */}
      <nav className="relative z-10 glass text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                StudySnap
              </Link>
              <Link to="/dashboard" className="text-white/80 hover:text-white flex items-center space-x-1">
                <span className="text-lg">🏠</span>
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>
            <button
              onClick={logout}
              className="text-white/80 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass rounded-2xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Your Profile</h1>
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 border border-green-500 text-green-100' : 'bg-red-500/20 border border-red-500 text-red-100'}`}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                disabled
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white/70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white/70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">College</label>
              <select
                name="college"
                value={formData.college}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="" className="bg-gray-800 text-white">Select College</option>
                {colleges.map(col => (
                  <option key={col._id} value={col._id} className="bg-gray-800 text-white">{col.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Course</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                disabled={!formData.college}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-gray-800 text-white">Select Course</option>
                {courses.map(crs => (
                  <option key={crs._id} value={crs._id} className="bg-gray-800 text-white">{crs.name} ({crs.code})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="glass p-4 rounded-lg text-center">
                <div className="text-yellow-300 text-2xl mb-1">🔥</div>
                <div className="text-white font-bold">{user?.dailyStreak || 0}</div>
                <div className="text-white/60 text-xs">Day Streak</div>
              </div>
              <div className="glass p-4 rounded-lg text-center">
                <div className="text-yellow-300 text-2xl mb-1">🪙</div>
                <div className="text-white font-bold">{user?.studyTokens || 0}</div>
                <div className="text-white/60 text-xs">Study Tokens</div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition duration-300 transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}