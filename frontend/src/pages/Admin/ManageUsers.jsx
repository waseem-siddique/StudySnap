import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ClickSpark from '../../components/ClickSpark';

export default function ManageUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Notification modal state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchColleges();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      fetchCourses(selectedCollege);
    } else {
      setCourses([]);
      setSelectedCourse('');
    }
  }, [selectedCollege]);

  useEffect(() => {
    fetchUsers();
  }, [selectedCollege, selectedCourse]);

  const fetchColleges = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/colleges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setColleges(res.data);
    } catch (err) {
      console.error('Failed to fetch colleges', err);
    }
  };

  const fetchCourses = async (collegeId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/admin/courses?college=${collegeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/admin/users';
      const params = new URLSearchParams();
      if (selectedCollege) params.append('college', selectedCollege);
      if (selectedCourse) params.append('course', selectedCourse);
      if (params.toString()) url += '?' + params.toString();

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      setError('Failed to load students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  const openNotificationModal = (userId) => {
    setSelectedUserId(userId);
    setNotificationMessage('');
    setShowNotificationModal(true);
  };

  const sendNotification = async () => {
    if (!notificationMessage.trim()) {
      alert('Please enter a message');
      return;
    }
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/admin/notifications',
        {
          userId: selectedUserId,
          message: notificationMessage,
          link: null // optional, can add later
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Notification sent!');
      setShowNotificationModal(false);
    } catch (err) {
      alert('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="text-center text-white py-20">Loading students...</div>;

  return (
    <ClickSpark sparkColor="#fff">
      <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900">
        {/* Navbar */}
        <nav className="glass text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/admin" className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Manage Students
              </Link>
              <Link to="/admin" className="text-white/80 hover:text-white">Back to Admin</Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-6">Students</h1>
          {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4">{error}</div>}

          {/* Filters */}
          <div className="glass p-4 rounded-lg mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-white/80 text-sm mb-1">Filter by College</label>
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="w-full p-2 bg-white/20 border border-white/30 rounded text-white"
              >
                <option value="" className="bg-gray-800 text-white">All Colleges</option>
                {colleges.map(col => (
                  <option key={col._id} value={col._id} className="bg-gray-800 text-white">{col.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-white/80 text-sm mb-1">Filter by Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={!selectedCollege}
                className="w-full p-2 bg-white/20 border border-white/30 rounded text-white disabled:opacity-50"
              >
                <option value="" className="bg-gray-800 text-white">All Courses</option>
                {courses.map(crs => (
                  <option key={crs._id} value={crs._id} className="bg-gray-800 text-white">{crs.name} ({crs.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left">Username</th>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">College</th>
                    <th className="px-6 py-3 text-left">Course</th>
                    <th className="px-6 py-3 text-left">Tokens</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-white/5">
                      <td className="px-6 py-4">{u.username}</td>
                      <td className="px-6 py-4">{u.name || '-'}</td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">{u.college?.name || '-'}</td>
                      <td className="px-6 py-4">{u.course?.name || '-'}</td>
                      <td className="px-6 py-4">{u.studyTokens}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openNotificationModal(u._id)}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-3 py-1 rounded mr-2"
                        >
                          Notify
                        </button>
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="text-red-300 hover:text-red-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {users.length === 0 && <p className="text-center text-white/70 mt-4">No students found.</p>}
        </main>

        {/* Notification Modal */}
        <AnimatePresence>
          {showNotificationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowNotificationModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 p-6 rounded-lg max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-4">Send Notification</h3>
                <textarea
                  rows="4"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter your message..."
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white mb-4"
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendNotification}
                    disabled={sending}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ClickSpark>
  );
}