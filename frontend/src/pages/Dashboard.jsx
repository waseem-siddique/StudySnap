import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import IDScanner from '../components/IDScanner';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import Background from '../components/Background';

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [streak, setStreak] = useState(user?.dailyStreak || 0);
  const [tokens, setTokens] = useState(user?.studyTokens || 0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [scannerKey, setScannerKey] = useState(0);

  // Update local state when user context changes
  useEffect(() => {
    setStreak(user?.dailyStreak || 0);
    setTokens(user?.studyTokens || 0);
  }, [user]);

  // Initial setup
  useEffect(() => {
    if (user?.lastLogin) {
      const last = new Date(user.lastLogin);
      const today = new Date();
      if (last.toDateString() === today.toDateString()) {
        setCheckedIn(true);
      }
    }
    if (user && !user.rollNo && !sessionStorage.getItem('instructionsShown')) {
      setShowInstructions(true);
      sessionStorage.setItem('instructionsShown', 'true');
    }
    fetchNotifications();
    fetchActivities();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.length);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const fetchActivities = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/activities');
      setActivities(res.data);
    } catch (err) {
      console.error('Failed to fetch activities');
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
    markAsRead(notification._id);
    setShowNotifications(false);
  };

  const handleCheckin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/users/checkin');
      setStreak(res.data.streak);
      setTokens(res.data.tokens);
      setCheckedIn(true);
      await refreshUser();
      fetchActivities();
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.error === 'Already checked in today') {
        setCheckedIn(true);
      } else {
        alert(err.response?.data?.error || 'Check-in failed');
      }
    }
  };

  const handleScanSuccess = useCallback(async (rollNo) => {
    setShowScanner(false);
    try {
      const res = await axios.post('http://localhost:5000/api/users/scan-id', { rollNo });
      setScanMessage(res.data.message);
      setTokens(res.data.tokens);
      await refreshUser();
      fetchActivities();
      setTimeout(() => setScanMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Scan failed');
    } finally {
      setTimeout(() => setScannerKey(prev => prev + 1), 200);
    }
  }, [refreshUser, fetchActivities]);

  const handleScanClose = useCallback(() => {
    setShowScanner(false);
    setTimeout(() => setScannerKey(prev => prev + 1), 200);
  }, []);

  const modules = [
    {
      title: 'Daily ID Scan',
      description: 'Scan your college ID to earn tokens',
      icon: '📱',
      color: 'from-blue-500 to-cyan-500',
      action: () => setShowScanner(true),
      buttonText: 'Scan Now & Mark Attendance',
      disabled: false,
    },
    {
      title: 'Quizzes',
      description: 'Test your knowledge and earn tokens',
      icon: '📝',
      color: 'from-green-500 to-emerald-500',
      link: '/quiz',
      buttonText: 'Take Quiz',
    },
    {
      title: 'E-Library',
      description: 'Access study materials',
      icon: '📚',
      color: 'from-purple-500 to-pink-500',
      link: '/library',
      buttonText: 'Browse',
    },
    {
      title: 'Video Lectures',
      description: 'Watch professor videos',
      icon: '🎥',
      color: 'from-red-500 to-orange-500',
      link: '/videos',
      buttonText: 'Watch',
    },
    {
      title: 'Connect',
      description: 'Find classmates',
      icon: '👥',
      color: 'from-indigo-500 to-purple-500',
      link: '/connect',
      buttonText: 'Connect',
    },
    {
      title: 'Study Groups',
      description: 'Join or create groups',
      icon: '👥',
      color: 'from-yellow-500 to-orange-500',
      link: '/groups',
      buttonText: 'Explore',
    },
  ];

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  const activityVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (custom) => ({
      opacity: 1,
      x: 0,
      transition: { delay: custom * 0.05 }
    })
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'checkin': return '🔥';
      case 'scan': return '📱';
      case 'quiz': return '📝';
      case 'upload': return '📄';
      case 'profile_update': return '✏️';
      default: return '📌';
    }
  };

  return (
    <Background>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Instructions Modal */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="glass p-6 rounded-lg max-w-md"
              >
                <h3 className="text-xl font-bold text-white mb-3">ID Scanning Guide</h3>
                <ul className="text-white/80 space-y-2 list-disc list-inside">
                  <li>Scan your college ID card to earn StudyTokens.</li>
                  <li>Your ID must contain a barcode with your roll number.</li>
                  <li>First scan: 5 tokens and your roll number is saved.</li>
                  <li>You can scan up to twice a day.</li>
                  <li>You must wait at least 3 hours between scans.</li>
                  <li>If the gap is 3–6 hours, you earn 2.5 tokens; if 6+ hours, you earn 5 tokens.</li>
                  <li>Maximum 10 tokens per day from ID scans.</li>
                  <li>You must always scan the same ID.</li>
                </ul>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Got it!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ID Scanner Modal */}
        <AnimatePresence>
          {showScanner && (
            <IDScanner
              key={scannerKey}
              onClose={handleScanClose}
              onSuccess={handleScanSuccess}
            />
          )}
        </AnimatePresence>

        {/* Floating success message */}
        <AnimatePresence>
          {scanMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50"
            >
              {scanMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navbar */}
        <nav className="relative z-20 glass text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Logo />
                <div className="hidden md:flex space-x-4">
                  <Link to="/dashboard" className="text-white/90 hover:text-white px-3 py-2">Home</Link>
                  <Link to="/quiz" className="text-white/90 hover:text-white px-3 py-2">Quiz</Link>
                  <Link to="/library" className="text-white/90 hover:text-white px-3 py-2">Library</Link>
                  <Link to="/videos" className="text-white/90 hover:text-white px-3 py-2">Videos</Link>
                  <Link to="/connect" className="text-white/90 hover:text-white px-3 py-2">Connect</Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="text-white/90 hover:text-white px-3 py-2">Admin</Link>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/token-history"
                    className="hidden sm:flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition cursor-pointer"
                  >
                    <span className="text-yellow-300">🔥</span>
                    <span className="text-white font-semibold">{streak}</span>
                    <span className="text-yellow-300 ml-2">🪙</span>
                    <span className="text-white font-semibold">{tokens}</span>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Link
                    to="/messages"
                    className="text-white/80 hover:text-white relative"
                    title="Messages"
                  >
                    <span className="text-xl">💬</span>
                  </Link>
                </motion.div>

                <div className="relative z-30">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="text-white/80 hover:text-white relative cursor-pointer"
                  >
                    <span className="text-xl">🔔</span>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </motion.button>
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl py-2 z-50 max-h-96 overflow-y-auto"
                      >
                        <div className="px-4 py-2 text-white border-b border-gray-700 font-semibold">Notifications</div>
                        {notifications.length === 0 ? (
                          <div className="px-4 py-2 text-gray-300 text-sm">No new notifications</div>
                        ) : (
                          notifications.map(n => (
                            <motion.div
                              key={n._id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              onClick={() => handleNotificationClick(n)}
                              className="px-4 py-3 text-gray-200 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-0"
                            >
                              <div className="flex items-start space-x-2">
                                <span className="text-lg">
                                  {n.type === 'connection_request' && '👥'}
                                  {n.type === 'connection_accepted' && '✅'}
                                  {n.type === 'connection_rejected' && '❌'}
                                  {n.type === 'quiz_available' && '📝'}
                                  {n.type === 'video_uploaded' && '🎥'}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm">{n.message}</p>
                                  {n.sender && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      From: {n.sender.name || n.sender.username}
                                      {n.sender.college?.name && ` • ${n.sender.college.name}`}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(n.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative z-30">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 text-white/90 hover:text-white cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:inline">{user?.username}</span>
                  </motion.button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 glass rounded-lg shadow-lg py-1 z-50"
                      >
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-white/90 hover:bg-white/10"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setShowProfileMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-white/90 hover:bg-white/10"
                        >
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.name || user?.username}!
            </h2>
            <p className="text-white/80">Ready to learn and earn today?</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="sm:hidden flex justify-between glass p-4 rounded-lg mb-6"
          >
            <motion.div variants={itemVariants} className="text-center flex-1">
              <Link to="/token-history">
                <div className="text-yellow-300 text-xl">🔥</div>
                <div className="text-white font-bold">{streak}</div>
                <div className="text-white/60 text-xs">Streak</div>
              </Link>
            </motion.div>
            <motion.div variants={itemVariants} className="text-center flex-1">
              <Link to="/token-history">
                <div className="text-yellow-300 text-xl">🪙</div>
                <div className="text-white font-bold">{tokens}</div>
                <div className="text-white/60 text-xs">Tokens</div>
              </Link>
            </motion.div>
            <motion.div variants={itemVariants} className="text-center flex-1">
              <div className="text-green-300 text-xl">✓</div>
              <div className="text-white font-bold">{checkedIn ? 'Done' : 'Pending'}</div>
              <div className="text-white/60 text-xs">Check-in</div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-6 rounded-lg mb-8 flex flex-col sm:flex-row justify-between items-center"
          >
            <div>
              <h3 className="text-xl font-semibold text-white">Daily Check-in</h3>
              <p className="text-white/70">Check in to maintain your streak and earn 10 tokens!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckin}
              disabled={checkedIn}
              className={`mt-4 sm:mt-0 bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-2 rounded-lg font-semibold transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                checkedIn ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {checkedIn ? 'Already Checked In ✅' : 'Check In 🔥'}
            </motion.button>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {modules.map((module, idx) => {
              if (module.title === 'Daily ID Scan') {
                // Plain card with CSS hover effect, button with high z-index
                return (
                  <div
                    key={idx}
                    className="group relative glass rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-200 hover:shadow-2xl"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${module.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                    <div className="p-6">
                      <div className="text-4xl mb-4">{module.icon}</div>
                      <h3 className="text-xl font-semibold text-white mb-2">{module.title}</h3>
                      <p className="text-white/70 text-sm mb-4">{module.description}</p>
                      {/* Plain button, high z-index, no motion */}
                      <button
                        onClick={module.action}
                        disabled={module.disabled}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105 disabled:opacity-50 relative z-50"
                        style={{ pointerEvents: 'auto' }}
                      >
                        {module.buttonText}
                      </button>
                    </div>
                  </div>
                );
              } else {
                // Other modules keep their spring animation
                return (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ y: -8, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
                    className="group relative glass rounded-xl overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${module.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                    <div className="p-6">
                      <div className="text-4xl mb-4">{module.icon}</div>
                      <h3 className="text-xl font-semibold text-white mb-2">{module.title}</h3>
                      <p className="text-white/70 text-sm mb-4">{module.description}</p>
                      {module.action ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={module.action}
                          disabled={module.disabled}
                          className={`w-full bg-gradient-to-r ${module.color} text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105 disabled:opacity-50`}
                        >
                          {module.buttonText}
                        </motion.button>
                      ) : (
                        <Link
                          to={module.link}
                          className={`block text-center bg-gradient-to-r ${module.color} text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105`}
                        >
                          {module.buttonText}
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              }
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 glass rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
            {loadingActivities ? (
              <div className="text-center text-white/70 py-4">Loading activities...</div>
            ) : activities.length === 0 ? (
              <p className="text-white/70 text-center py-4">No recent activity.</p>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {activities.map((act, index) => (
                    <motion.div
                      key={act._id}
                      custom={index}
                      variants={activityVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center space-x-3 text-white/80"
                    >
                      <span className="text-lg">{getActivityIcon(act.type)}</span>
                      <span>{act.description}</span>
                      <span className="text-xs text-white/50 ml-auto">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </motion.div>
        </main>
      </motion.div>
    </Background>
  );
}