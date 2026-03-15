import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Background from '../components/Background';
import Logo from '../components/Logo';

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
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    if (formData.college) {
      fetchCourses(formData.college);
    } else {
      setCourses([]);
    }
  }, [formData.college]);

  const fetchColleges = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/colleges');
      setColleges(res.data);
    } catch (err) {
      console.error('Failed to fetch colleges', err);
      setError('Could not load colleges. Please try again later.');
    }
  };

  const fetchCourses = async (collegeId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/courses?college=${collegeId}`);
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to fetch courses', err);
      setError('Could not load courses for selected college.');
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    if (password.length < minLength) {
      return { valid: false, message: `Password must be at least ${minLength} characters` };
    }
    if (!hasUpperCase) {
      return { valid: false, message: 'Must contain at least one uppercase letter' };
    }
    if (!hasLowerCase) {
      return { valid: false, message: 'Must contain at least one lowercase letter' };
    }
    if (!hasNumbers) {
      return { valid: false, message: 'Must contain at least one number' };
    }
    if (!hasSpecial) {
      return { valid: false, message: 'Must contain at least one special character' };
    }
    return { valid: true, message: 'Strong password' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');

    if (name === 'password') {
      const result = validatePassword(value);
      setPasswordStrength({ score: result.valid ? 100 : 0, feedback: result.message });
    }
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

    const passwordCheck = validatePassword(formData.password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message);
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
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 rounded-lg w-full max-w-lg">
          <div className="flex items-center justify-center mb-6">
            <Logo />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-6">Professor Signup</h2>

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
              />
              <p className={`text-xs mt-1 ${passwordStrength.score === 100 ? 'text-green-300' : 'text-yellow-300'}`}>
                {passwordStrength.feedback}
              </p>
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
                <option value="" className="bg-gray-800 text-white">Select College</option>
                {colleges.map(col => (
                  <option key={col._id} value={col._id} className="bg-gray-800 text-white">{col.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-white mb-1">Courses (you can select multiple)</label>
              <select
                multiple
                name="courses"
                value={formData.courses}
                onChange={handleCourseChange}
                className="w-full p-2 bg-white/20 border border-white/30 rounded text-white h-32"
                disabled={!formData.college || courses.length === 0}
              >
                {courses.length === 0 ? (
                  <option disabled className="bg-gray-800 text-white">
                    {!formData.college ? 'Select a college first' : 'No courses available'}
                  </option>
                ) : (
                  courses.map(c => (
                    <option key={c._id} value={c._id} className="bg-gray-800 text-white">
                      {c.name} ({c.code})
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-white/50 mt-1">Hold Ctrl (Cmd on Mac) to select multiple</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Register'}
            </button>
          </form>

          <p className="mt-4 text-white/70 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-300 hover:text-purple-200">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </Background>
  );
}