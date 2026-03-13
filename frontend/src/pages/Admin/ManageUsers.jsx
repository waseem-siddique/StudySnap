import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function ManageUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'professors'
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });

  useEffect(() => {
    fetchStudents();
    fetchProfessors();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessors = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/professors');
      setProfessors(res.data);
    } catch (err) {
      console.error('Failed to fetch professors');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`);
      fetchStudents();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleDeleteProfessor = async (profId) => {
    if (!window.confirm('Are you sure you want to delete this professor?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/professors/${profId}`);
      fetchProfessors();
    } catch (err) {
      alert('Failed to delete professor');
    }
  };

  const startEdit = (item) => {
    setEditingUser(item);
    setEditForm({ name: item.name || '', email: item.email || '', role: item.role || 'student' });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', email: '', role: '' });
  };

  const saveEdit = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${editingUser._id}`, editForm);
      fetchStudents();
      cancelEdit();
    } catch (err) {
      alert('Failed to update user');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 animate-gradient-xy">
      {/* Animated blobs */}
      <div className="fixed w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 -left-10"></div>
      <div className="fixed w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-0 right-0"></div>

      {/* Navbar */}
      <nav className="relative z-10 glass text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/admin" className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Manage Users
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-white/80 hover:text-white">Back to Admin</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'students'
                ? 'bg-purple-500 text-white'
                : 'glass text-white/80 hover:text-white'
            }`}
          >
            Students ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('professors')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'professors'
                ? 'bg-purple-500 text-white'
                : 'glass text-white/80 hover:text-white'
            }`}
          >
            Professors ({professors.length})
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="glass rounded-xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-2">Username</th>
                    <th className="text-left py-3 px-2">Name</th>
                    <th className="text-left py-3 px-2">Email</th>
                    <th className="text-left py-3 px-2">Role</th>
                    <th className="text-left py-3 px-2">College</th>
                    <th className="text-left py-3 px-2">Tokens</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-2">{u.username}</td>
                      <td className="py-3 px-2">{u.name || '-'}</td>
                      <td className="py-3 px-2">{u.email}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          u.role === 'admin' ? 'bg-red-500/30 text-red-200' :
                          u.role === 'professor' ? 'bg-green-500/30 text-green-200' :
                          'bg-blue-500/30 text-blue-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-2">{u.college?.name || '-'}</td>
                      <td className="py-3 px-2">{u.studyTokens}</td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => startEdit(u)}
                          className="text-blue-300 hover:text-blue-200 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
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
        )}

        {/* Professors Tab */}
        {activeTab === 'professors' && (
          <div className="glass rounded-xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-2">Name</th>
                    <th className="text-left py-3 px-2">Email</th>
                    <th className="text-left py-3 px-2">College</th>
                    <th className="text-left py-3 px-2">Courses</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {professors.map(p => (
                    <tr key={p._id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-2">{p.name}</td>
                      <td className="py-3 px-2">{p.email}</td>
                      <td className="py-3 px-2">{p.college?.name || '-'}</td>
                      <td className="py-3 px-2">
                        {p.courses?.map(c => c.name).join(', ') || '-'}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleDeleteProfessor(p._id)}
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
        )}

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass p-6 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Edit User</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                />
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                >
                  <option value="student">Student</option>
                  <option value="professor">Professor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}