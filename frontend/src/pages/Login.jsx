import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'professor'
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 animate-gradient-xy p-4">
      <div className="glass p-8 rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-2">StudySnap</h1>
        <p className="text-white/80 text-center mb-6">Connect, Learn, Earn</p>

        {/* Tabs */}
        <div className="flex mb-6">
          <button
            onClick={() => setActiveTab('student')}
            className={`flex-1 py-2 rounded-l-lg transition ${
              activeTab === 'student'
                ? 'bg-purple-600 text-white'
                : 'bg-white/20 text-white/80 hover:bg-white/30'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => setActiveTab('professor')}
            className={`flex-1 py-2 rounded-r-lg transition ${
              activeTab === 'professor'
                ? 'bg-purple-600 text-white'
                : 'bg-white/20 text-white/80 hover:bg-white/30'
            }`}
          >
            Professor
          </button>
        </div>

        {activeTab === 'student' ? <StudentLogin /> : <ProfessorLogin />}

        {/* Admin Login Link */}
        <p className="mt-4 text-white/70 text-center">
          <Link to="/admin/login" className="text-purple-300 hover:text-purple-200">Admin Login? Click Here</Link>
        </p>
      </div>
    </div>
  );
}

// ---------- Student Login (OTP) ----------
function StudentLogin() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [step, setStep] = useState(1); // 1: mobile, 2: otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const requestOtp = async (e) => {
    e.preventDefault();
    if (!mobile || mobile.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/request-otp', { mobile });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Enter 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', {
        mobile,
        otp,
        email: email || undefined,
        username: username || undefined
      });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded-lg mb-4">{error}</div>}
      {step === 1 ? (
        <form onSubmit={requestOtp}>
          <div className="mb-4">
            <label className="block text-white/90 text-sm font-medium mb-2">Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter 10-digit mobile"
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition duration-300 transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <div className="mb-4">
            <label className="block text-white/90 text-sm font-medium mb-2">OTP (use 123456)</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-white/90 text-sm font-medium mb-2">Email (required for new users)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div className="mb-6">
            <label className="block text-white/90 text-sm font-medium mb-2">Username (required for new users)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a unique username"
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-500 hover:to-blue-600 transition duration-300 transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-3 text-white/80 hover:text-white text-sm"
          >
            ← Back to mobile
          </button>
        </form>
      )}
    </>
  );
}

// ---------- Professor Login (Email/Password) ----------
function ProfessorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/professor/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({ ...res.data.professor, role: 'professor' }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-white/90 text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-white/90 text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="mt-3 text-white/70 text-center">
        New professor? <Link to="/professor/signup" className="text-purple-300 hover:text-purple-200">Sign up here</Link>
      </p>
    </>
  );
}