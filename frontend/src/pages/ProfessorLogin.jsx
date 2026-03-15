import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Background from '../components/Background';
import Logo from '../components/Logo';

export default function ProfessorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/professor/login', { email, password });
      login(res.data.token); // only token – user fetched automatically
      navigate('/professor/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 rounded-lg w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Logo />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-6">Professor Login</h2>
          {error && <div className="bg-red-500/20 text-red-200 p-2 rounded mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-white mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-white/20 border border-white/30 rounded text-white"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-white mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-white/20 border border-white/30 rounded text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="mt-4 text-white/70 text-center">
            <Link to="/login" className="text-purple-300 hover:text-purple-200">Back to Student Login</Link>
          </p>
          <p className="mt-2 text-white/70 text-center">
            <Link to="/admin/login" className="text-purple-300 hover:text-purple-200">Admin Login</Link>
          </p>
        </div>
      </div>
    </Background>
  );
}