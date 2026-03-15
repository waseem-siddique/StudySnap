import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ClickSpark from '../../components/ClickSpark';

export default function ManageColleges() {
  const { user } = useAuth();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/colleges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setColleges(res.data);
    } catch (err) {
      setError('Failed to load colleges. Please check your connection.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `http://localhost:5000/api/admin/colleges/${editingId}`
        : 'http://localhost:5000/api/admin/colleges';
      const method = editingId ? 'put' : 'post';
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/colleges/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchColleges();
    } catch (err) {
      alert('Failed to delete college');
    }
  };

  if (loading) return <div className="text-center text-white py-20">Loading colleges...</div>;

  return (
    <ClickSpark sparkColor="#fff">
      <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900">
        <nav className="glass text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/admin" className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Manage Colleges
              </Link>
              <Link to="/admin" className="text-white/80 hover:text-white">Back to Admin</Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Colleges</h1>
            <button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
              + Add College
            </button>
          </div>

          {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4">{error}</div>}

          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
                <h3 className="text-xl text-white mb-4">{editingId ? 'Edit' : 'Add'} College</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" placeholder="College Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white" required />
                  <input type="text" placeholder="Location (optional)" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white" />
                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-700 text-white rounded">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {colleges.map(college => (
              <div key={college._id} className="glass p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">{college.name}</h3>
                {college.location && <p className="text-white/70 text-sm">{college.location}</p>}
                <div className="flex justify-end space-x-2 mt-4">
                  <button onClick={() => handleEdit(college)} className="text-blue-300 hover:text-blue-200">Edit</button>
                  <button onClick={() => handleDelete(college._id)} className="text-red-300 hover:text-red-200">Delete</button>
                </div>
              </div>
            ))}
            {colleges.length === 0 && <div className="col-span-full text-center text-white/70 py-8">No colleges added yet.</div>}
          </div>
        </main>
      </div>
    </ClickSpark>
  );
}