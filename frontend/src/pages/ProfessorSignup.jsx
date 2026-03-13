import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function ProfessorSignup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    courses: []
  });
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    if (formData.college) {
      fetchCourses(formData.college);
    }
  }, [formData.college]);

  const fetchColleges = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/colleges');
      setColleges(res.data);
    } catch (err) {
      console.error('Failed to fetch colleges');
    }
  };

  const fetchCourses = async (collegeId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/courses?college=${collegeId}`);
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to fetch courses');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCourseChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, courses: selectedOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:5000/api/auth/professor/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        college: formData.college,
        courses: formData.courses
      });
      setSuccess('Registration successful! Await admin approval.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 p-4">
      <div className="glass p-8 rounded-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold text-white mb-6">Professor Signup</h2>
        {error && <div className="bg-red-500/20 text-red-200 p-2 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-500/20 text-green-200 p-2 rounded mb-4">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 bg-white/20 border border-white/30 rounded text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 bg-white/20 border border-white/30 rounded text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 bg-white/20 border border-white/30 rounded text-white"
              required
              minLength="6"
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-2 bg-white/20 border border-white/30 rounded text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-1">College</label>
            <select
              name="college"
              value={formData.college}
              onChange={handleChange}
              className="w-full p-2 bg-white/20 border border-white/30 rounded text-white"
              required
            >
              <option value="" className="bg-gray-800">Select College</option>
              {colleges.map(col => (
                <option key={col._id} value={col._id} className="bg-gray-800">{col.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-white mb-1">Courses (optional, hold Ctrl/Cmd to select multiple)</label>
            <select
              multiple
              name="courses"
              value={formData.courses}
              onChange={handleCourseChange}
              className="w-full p-2 bg-white/20 border border-white/30 rounded text-white h-32"
            >
              {courses.map(c => (
                <option key={c._id} value={c._id} className="bg-gray-800">{c.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
          >
            {loading ? 'Submitting...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-white/70 text-center">
          Already have an account? <Link to="/login" className="text-purple-300 hover:text-purple-200">Login here</Link>
        </p>
      </div>
    </div>
  );
}