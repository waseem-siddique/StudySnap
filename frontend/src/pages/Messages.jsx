import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import Background from '../components/Background';

export default function Messages() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'groups'
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConversations();
    fetchGroups();
  }, [user]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/messages/conversations/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/groups/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <Background>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl animate-pulse">Loading conversations...</div>
        </div>
      </Background>
    );
  }

  return (
    <Background>
      <nav className="glass text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Logo />
              <Link to="/dashboard" className="text-white/80 hover:text-white flex items-center space-x-1">
                <span className="text-lg">🏠</span>
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>
            <button onClick={logout} className="text-white/80 hover:text-white">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'chats'
                ? 'bg-purple-600 text-white'
                : 'glass text-white/80 hover:text-white'
            }`}
          >
            Chats ({conversations.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'groups'
                ? 'bg-purple-600 text-white'
                : 'glass text-white/80 hover:text-white'
            }`}
          >
            Groups ({groups.length})
          </button>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence>
            {activeTab === 'chats' && (
              <>
                {conversations.length === 0 ? (
                  <motion.div variants={itemVariants} className="glass p-12 text-center rounded-2xl">
                    <div className="text-6xl mb-4 opacity-50">💬</div>
                    <p className="text-white/70 text-lg">No chats yet.</p>
                    <p className="text-white/50 mt-2">Start connecting with classmates!</p>
                  </motion.div>
                ) : (
                  conversations.map(conv => (
                    <motion.div key={conv.userId} variants={itemVariants}>
                      <Link to={`/chat/${conv.userId}`} className="block group">
                        <div className="glass p-4 rounded-2xl hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                                {getInitials(conv.name || conv.username)}
                              </div>
                              {conv.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                  {conv.unreadCount}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline">
                                <h3 className="text-white font-semibold truncate">
                                  {conv.name || conv.username}
                                </h3>
                                <span className="text-xs text-white/40">
                                  {formatTime(conv.lastMessage.createdAt)}
                                </span>
                              </div>
                              <p className="text-white/60 text-sm truncate mt-1">
                                {conv.lastMessage.sender === user.id ? 'You: ' : ''}
                                {conv.lastMessage.fileName
                                  ? '📎 Sent a PDF'
                                  : conv.lastMessage.content || 'No message'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </>
            )}

            {activeTab === 'groups' && (
              <>
                {groups.length === 0 ? (
                  <motion.div variants={itemVariants} className="glass p-12 text-center rounded-2xl">
                    <div className="text-6xl mb-4 opacity-50">👥</div>
                    <p className="text-white/70 text-lg">No groups yet.</p>
                    <p className="text-white/50 mt-2">Join or create a study group!</p>
                  </motion.div>
                ) : (
                  groups.map(group => (
                    <motion.div key={group._id} variants={itemVariants}>
                      <Link to={`/group/${group._id}`} className="block group">
                        <div className="glass p-4 rounded-2xl hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                              👥
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline">
                                <h3 className="text-white font-semibold truncate">{group.name}</h3>
                                <span className="text-xs text-white/40">
                                  {group.members?.length || 1} members
                                </span>
                              </div>
                              <p className="text-white/60 text-sm truncate mt-1">
                                {group.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </Background>
  );
}