import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ClickSpark from '../../components/ClickSpark';

export default function ManageCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', college: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchColleges();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
    } catch (err) {
      setError('Failed to load courses');
      console.error(err);
    }
  };

  const fetchColleges = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/colleges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setColleges(res.data);
    } catch (err) {
      console.error('Failed to load colleges', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.college) {
      alert('Please fill all required fields');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const url = editingId
        ? `http://localhost:5000/api/admin/courses/${editingId}`
        : 'http://localhost:5000/api/admin/courses';
      const method = editingId ? 'put' : 'post';
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourses();
      setShowForm(false);
      setFormData({ name: '', code: '', college: '', description: '' });
      setEditingId(null);
    } catch (err) {
      alert('Failed to save course');
    }
  };

  const handleEdit = (course) => {
    setFormData({
      name: course.name,
      code: course.code,
      college: course.college._id,
      description: course.description || ''
    });
    setEditingId(course._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourses();
    } catch (err) {
      alert('Failed to delete course');
    }
  };

  if (loading) return <div className="text-center text-white py-20">Loading courses...</div>;

  return (
    <ClickSpark sparkColor="#fff">
      <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900">
        <nav className="glass text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/admin" className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Manage Courses
              </Link>
              <Link to="/admin" className="text-white/80 hover:text-white">Back to Admin</Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Courses</h1>
            <button
              onClick={() => {
                setFormData({ name: '', code: '', college: '', description: '' });
                setEditingId(null);
                setShowForm(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              + Add Course
            </button>
          </div>

          {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4">{error}</div>}

          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
                <h3 className="text-xl text-white mb-4">{editingId ? 'Edit' : 'Add'} Course</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Course Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Course Code (e.g., CSE)"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    required
                  />
                  <select
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    required
                  >
                    <option value="">Select College</option>
                    {colleges.map(col => (
                      <option key={col._id} value={col._id}>{col.name}</option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      {editingId ? 'Update' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course._id} className="glass p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-1">{course.name}</h3>
                <p className="text-white/60 text-sm mb-2">{course.code}</p>
                <p className="text-white/70 text-sm mb-2">{course.college?.name}</p>
                {course.description && <p className="text-white/60 text-xs mb-4">{course.description}</p>}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course._id)}
                    className="text-red-300 hover:text-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <div className="col-span-full text-center text-white/70 py-8">
                No courses added yet.
              </div>
            )}
          </div>
        </main>
      </div>
    </ClickSpark>
  );
}