import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalProfessors: 0,
    totalColleges: 0,
    totalCourses: 0,
    totalVideos: 0,
    pendingVideos: 0,
    totalMaterials: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  // Inside AdminDashboard, after stats cards, add:
const [pendingProfessors, setPendingProfessors] = useState([]);
useEffect(() => {
  fetchPendingProfessors();
}, []);

const fetchPendingProfessors = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/admin/professors/pending');
    setPendingProfessors(res.data);
  } catch (err) {
    console.error('Failed to fetch pending professors');
  }
};

const handleApprove = async (id, approve) => {
  try {
    await axios.put(`http://localhost:5000/api/admin/professors/${id}/approve`, { approved: approve });
    fetchPendingProfessors(); // refresh
  } catch (err) {
    alert('Failed to update');
  }
};

// Render pending professors:
{
  pendingProfessors.length > 0 && (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">Pending Professor Approvals</h2>
      <div className="space-y-4">
        {pendingProfessors.map(p => (
          <div key={p._id} className="glass p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-white font-semibold">{p.name}</p>
              <p className="text-white/70 text-sm">{p.email}</p>
              <p className="text-white/60 text-xs">College: {p.college?.name}</p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleApprove(p._id, true)}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-4 py-2 rounded"
              >
                Approve
              </button>
              <button
                onClick={() => handleApprove(p._id, false)}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

  const adminModules = [
    { title: 'Manage Students', icon: '👥', count: stats.totalStudents, link: '/admin/users', color: 'from-blue-500 to-cyan-500' },
    { title: 'Manage Professors', icon: '👨‍🏫', count: stats.totalProfessors, link: '/admin/professors', color: 'from-green-500 to-emerald-500' },
    { title: 'Manage Colleges', icon: '🏛️', count: stats.totalColleges, link: '/admin/colleges', color: 'from-purple-500 to-pink-500' },
    { title: 'Manage Courses', icon: '📚', count: stats.totalCourses, link: '/admin/courses', color: 'from-yellow-500 to-orange-500' },
    { title: 'Pending Videos', icon: '🎥', count: stats.pendingVideos, link: '/admin/videos/pending', color: 'from-red-500 to-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 animate-gradient-xy">
      {/* Animated blobs */}
      <div className="fixed w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 -left-10"></div>
      <div className="fixed w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-0 right-0"></div>
      <div className="fixed w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 bottom-20 left-20"></div>

      {/* Navbar */}
      <nav className="relative z-10 glass text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Admin Panel
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-white/80">Admin: {user?.username}</span>
              <Link to="/dashboard" className="text-white/80 hover:text-white">Back to Dashboard</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Admin Dashboard</h1>

        {loading ? (
          <div className="text-center text-white">Loading stats...</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="glass p-6 rounded-lg">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold text-white">{stats.totalStudents}</div>
                <div className="text-white/70">Total Students</div>
              </div>
              <div className="glass p-6 rounded-lg">
                <div className="text-3xl mb-2">👨‍🏫</div>
                <div className="text-2xl font-bold text-white">{stats.totalProfessors}</div>
                <div className="text-white/70">Total Professors</div>
              </div>
              <div className="glass p-6 rounded-lg">
                <div className="text-3xl mb-2">🏛️</div>
                <div className="text-2xl font-bold text-white">{stats.totalColleges}</div>
                <div className="text-white/70">Colleges</div>
              </div>
              <div className="glass p-6 rounded-lg">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-2xl font-bold text-white">{stats.totalCourses}</div>
                <div className="text-white/70">Courses</div>
              </div>
              <div className="glass p-6 rounded-lg">
                <div className="text-3xl mb-2">🎥</div>
                <div className="text-2xl font-bold text-white">{stats.totalVideos}</div>
                <div className="text-white/70">Videos</div>
              </div>
              <div className="glass p-6 rounded-lg">
                <div className="text-3xl mb-2">⏳</div>
                <div className="text-2xl font-bold text-white">{stats.pendingVideos}</div>
                <div className="text-white/70">Pending Videos</div>
              </div>
            </div>

            {/* Management Modules */}
            <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminModules.map((module, idx) => (
                <Link
                  key={idx}
                  to={module.link}
                  className="group relative glass rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${module.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                  <div className="p-6">
                    <div className="text-4xl mb-2">{module.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-2">{module.title}</h3>
                    <p className="text-white/70 text-sm">{module.count} items</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}