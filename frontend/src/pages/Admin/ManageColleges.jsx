import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function ManageColleges() {
  const { user } = useAuth();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/colleges');
      setColleges(res.data);
    } catch (err) {
      console.error('Failed to fetch colleges');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/admin/colleges/${editingId}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/admin/colleges', formData);
      }
      fetchColleges();
      setShowForm(false);
      setFormData({ name: '', location: '' });
      setEditingId(null);
    } catch (err) {
      alert('Failed to save college');
    }
  };

  const handleEdit = (college) => {
    setFormData({ name: college.name, location: college.location || '' });
    setEditingId(college._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this college?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/colleges/${id}`);
      fetchColleges();
    } catch (err) {
      alert('Failed to delete college');
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
              Manage Colleges
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-white/80 hover:text-white">Back to Admin</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Colleges</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setFormData({ name: '', location: '' });
              setEditingId(null);
            }}
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition"
          >
            + Add College
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass p-6 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">
                {editingId ? 'Edit College' : 'Add New College'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="College Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Colleges List */}
        {loading ? (
          <div className="text-center text-white">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {colleges.map(college => (
              <div key={college._id} className="glass p-6 rounded-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <h3 className="text-xl font-semibold text-white mb-2">{college.name}</h3>
                {college.location && <p className="text-white/70 text-sm mb-4">{college.location}</p>}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(college)}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(college._id)}
                    className="text-red-300 hover:text-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {colleges.length === 0 && (
              <div className="col-span-full text-center text-white/70 py-8">No colleges added yet.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}