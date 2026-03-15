import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import ClickSpark from '../components/ClickSpark';

export default function Connect() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'pending') setActiveTab('pending');
    else if (tab === 'connections') setActiveTab('connections');
  }, [location.search]);

  useEffect(() => {
    fetchConnections();
    fetchPendingRequests();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/connections');
      setConnections(res.data);
    } catch (err) {
      console.error('Failed to fetch connections');
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/connections/pending');
      setPendingRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch pending requests');
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/users/search?username=${searchTerm}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (username) => {
    try {
      await axios.post(`http://localhost:5000/api/connections/request/${username}`);
      alert('Request sent!');
      setSearchResults(prev => prev.filter(u => u.username !== username));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send request');
    }
  };

  const acceptRequest = async (userId) => {
    try {
      await axios.post(`http://localhost:5000/api/connections/accept/${userId}`);
      fetchPendingRequests();
      fetchConnections();
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  const rejectRequest = async (userId) => {
    try {
      await axios.post(`http://localhost:5000/api/connections/reject/${userId}`);
      fetchPendingRequests();
    } catch (err) {
      alert('Failed to reject request');
    }
  };

  const removeConnection = async (userId) => {
    if (!window.confirm('Remove this connection?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/connections/${userId}`);
      fetchConnections();
    } catch (err) {
      alert('Failed to remove connection');
    }
  };

  return (
    <ClickSpark sparkColor="#fff">
      <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 animate-gradient-xy">
        <div className="fixed w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 -left-10 pointer-events-none"></div>
        <div className="fixed w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-0 right-0 pointer-events-none"></div>
        <div className="fixed w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 bottom-20 left-20 pointer-events-none"></div>

        <nav className="relative z-10 glass text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  StudySnap
                </Link>
                <Link to="/dashboard" className="text-white/80 hover:text-white flex items-center space-x-1">
                  <span className="text-lg">🏠</span>
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-white/80">🪙 {user?.studyTokens}</span>
                <Link to="/profile" className="text-white/80 hover:text-white">Profile</Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-6">Connect with Classmates</h1>
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'search'
                  ? 'bg-purple-500 text-white'
                  : 'glass text-white/80 hover:text-white'
              }`}
            >
              🔍 Search
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'connections'
                  ? 'bg-purple-500 text-white'
                  : 'glass text-white/80 hover:text-white'
              }`}
            >
              👥 Connections ({connections.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'pending'
                  ? 'bg-purple-500 text-white'
                  : 'glass text-white/80 hover:text-white'
              }`}
            >
              ⏳ Pending ({pendingRequests.length})
            </button>
          </div>

          {activeTab === 'search' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  onClick={searchUsers}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map(result => (
                  <div key={result._id} className="glass p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link to={`/profile/${result._id}`} className="hover:text-purple-300">
                          <h3 className="text-white font-semibold">@{result.username}</h3>
                        </Link>
                        <p className="text-white/70 text-sm">{result.name || 'No name'}</p>
                        {result.college && <p className="text-white/60 text-xs">{result.college.name}</p>}
                        {result.course && <p className="text-white/60 text-xs">{result.course.name}</p>}
                      </div>
                      <button
                        onClick={() => sendRequest(result.username)}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-1 rounded-full text-sm transition"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                ))}
                {searchResults.length === 0 && searchTerm && !loading && (
                  <div className="col-span-full text-center text-white/70 py-8">No users found.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map(conn => (
                <div key={conn._id} className="glass p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link to={`/profile/${conn._id}`} className="hover:text-purple-300">
                        <h3 className="text-white font-semibold">@{conn.username}</h3>
                      </Link>
                      <p className="text-white/70 text-sm">{conn.name || 'No name'}</p>
                      {conn.college && <p className="text-white/60 text-xs">{conn.college.name}</p>}
                      {conn.course && <p className="text-white/60 text-xs">{conn.course.name}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/chat/${conn._id}`}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-1 rounded-full text-sm transition"
                      >
                        💬 Chat
                      </Link>
                      <button
                        onClick={() => removeConnection(conn._id)}
                        className="text-red-300 hover:text-red-200 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {connections.length === 0 && (
                <div className="col-span-full text-center text-white/70 py-8">No connections yet.</div>
              )}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRequests.map(req => (
                <div key={req._id} className="glass p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link to={`/profile/${req._id}`} className="hover:text-purple-300">
                        <h3 className="text-white font-semibold">@{req.username}</h3>
                      </Link>
                      <p className="text-white/70 text-sm">{req.name || 'No name'}</p>
                      {req.college && <p className="text-white/60 text-xs">{req.college.name}</p>}
                      {req.course && <p className="text-white/60 text-xs">{req.course.name}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptRequest(req._id)}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-1 rounded-full text-sm transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectRequest(req._id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1 rounded-full text-sm transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <div className="col-span-full text-center text-white/70 py-8">No pending requests.</div>
              )}
            </div>
          )}
        </main>
      </div>
    </ClickSpark>
  );
}