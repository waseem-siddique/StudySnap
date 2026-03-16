import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Background from '../components/Background';
import Logo from '../components/Logo';
import { API_BASE_URL } from '../config';

export default function Login() {
  return (
    <Background>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 rounded-lg w-full max-w-md">
          <div className="flex justify-center mb-2">
            <Logo />
          </div>
          <p className="text-white/80 text-center mb-6">Connect, Learn, Earn</p>

          <StudentLogin />

          <div className="mt-6 space-y-2 text-center">
            <p className="text-white/70">
              Professor?{' '}
              <Link to="/professor/login" className="text-purple-300 hover:text-purple-200">
                Click here
              </Link>
            </p>
            <p className="text-white/70">
              Admin?{' '}
              <Link to="/admin/login" className="text-purple-300 hover:text-purple-200">
                Click here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Background>
  );
}

function StudentLogin() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userExists, setUserExists] = useState(false);
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
      await axios.post(`${API_BASE_URL}/auth/request-otp`, { mobile });
      const checkRes = await axios.get(`${API_BASE_URL}/auth/check-user/${mobile}`);
      if (checkRes.data.exists) {
        setUserExists(true);
        setEmail(checkRes.data.email);
        setUsername(checkRes.data.username);
      } else {
        setUserExists(false);
        setEmail('');
        setUsername('');
      }
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to send OTP');
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
      const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        mobile,
        otp,
        email: email || undefined,
        username: username || undefined
      });
      login(res.data.token);
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
            <label className="block text-white/90 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className={`w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                userExists ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={userExists || loading}
              readOnly={userExists}
            />
            {userExists && <p className="text-xs text-white/50 mt-1">This email is associated with your account</p>}
          </div>
          <div className="mb-6">
            <label className="block text-white/90 text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a unique username"
              className={`w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                userExists ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={userExists || loading}
              readOnly={userExists}
            />
            {userExists && <p className="text-xs text-white/50 mt-1">Your username is already set</p>}
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