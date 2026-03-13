import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('mygroups');

  useEffect(() => {
    fetchMyGroups();
    fetchAllGroups();
  }, []);

  const fetchMyGroups = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/groups/my');
      setMyGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch my groups');
    }
  };

  const fetchAllGroups = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/groups');
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups');
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/groups', newGroup);
      setNewGroup({ name: '', description: '' });
      setShowCreateForm(false);
      fetchMyGroups();
      fetchAllGroups();
    } catch (err) {
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId) => {
    try {
      await axios.post(`http://localhost:5000/api/groups/${groupId}/join`);
      fetchMyGroups();
      fetchAllGroups();
    } catch (err) {
      alert('Failed to join group');
    }
  };

  const leaveGroup = async (groupId) => {
    try {
      await axios.post(`http://localhost:5000/api/groups/${groupId}/leave`);
      fetchMyGroups();
      fetchAllGroups();
    } catch (err) {
      alert('Failed to leave group');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 animate-gradient-xy">
      {/* Animated blobs */}
      <div className="fixed w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 -left-10 pointer-events-none"></div>
      <div className="fixed w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-0 right-0 pointer-events-none"></div>
      <div className="fixed w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 bottom-20 left-20 pointer-events-none"></div>

      {/* Navbar with Home button */}
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Study Groups</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition"
          >
            + Create Group
          </button>
        </div>

        {showCreateForm && (
          <div className="glass rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Group</h2>
            <form onSubmit={createGroup} className="space-y-4">
              <input
                type="text"
                placeholder="Group Name"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-600 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </div>
        )}

        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('mygroups')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'mygroups'
                ? 'bg-purple-500 text-white'
                : 'glass text-white/80 hover:text-white'
            }`}
          >
            My Groups ({myGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'discover'
                ? 'bg-purple-500 text-white'
                : 'glass text-white/80 hover:text-white'
            }`}
          >
            Discover
          </button>
        </div>

        {activeTab === 'mygroups' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map(group => (
              <div key={group._id} className="glass rounded-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <h3 className="text-xl font-semibold text-white mb-2">{group.name}</h3>
                <p className="text-white/70 text-sm mb-3">{group.description || 'No description'}</p>
                <p className="text-white/60 text-xs mb-4">👥 {group.members?.length || 1} members</p>
                <button
                  onClick={() => leaveGroup(group._id)}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg transition"
                >
                  Leave Group
                </button>
              </div>
            ))}
            {myGroups.length === 0 && (
              <div className="col-span-full text-center text-white/70 py-8">You haven't joined any groups yet.</div>
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => {
              const isMember = myGroups.some(g => g._id === group._id);
              return (
                <div key={group._id} className="glass rounded-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <h3 className="text-xl font-semibold text-white mb-2">{group.name}</h3>
                  <p className="text-white/70 text-sm mb-3">{group.description || 'No description'}</p>
                  <p className="text-white/60 text-xs mb-4">👥 {group.members?.length || 1} members</p>
                  {isMember ? (
                    <button
                      onClick={() => leaveGroup(group._id)}
                      className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg transition"
                    >
                      Leave Group
                    </button>
                  ) : (
                    <button
                      onClick={() => joinGroup(group._id)}
                      className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition"
                    >
                      Join Group
                    </button>
                  )}
                </div>
              );
            })}
            {groups.length === 0 && (
              <div className="col-span-full text-center text-white/70 py-8">No groups available to join.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}