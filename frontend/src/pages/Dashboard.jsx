import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import IDScanner from '../components/IDScanner';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [streak, setStreak] = useState(user?.dailyStreak || 0);
  const [tokens, setTokens] = useState(user?.studyTokens || 0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if user has checked in today
    if (user?.lastLogin) {
      const last = new Date(user.lastLogin);
      const today = new Date();
      if (last.toDateString() === today.toDateString()) {
        setCheckedIn(true);
      }
    }
    // Show ID scanning instructions if user has no roll number
    if (user && !user.rollNo) {
      setShowInstructions(true);
    }
  }, [user]);

  const handleCheckin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/users/checkin');
      setStreak(res.data.streak);
      setTokens(res.data.tokens);
      setCheckedIn(true);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.error === 'Already checked in today') {
        setCheckedIn(true);
      } else {
        alert(err.response?.data?.error || 'Check-in failed');
      }
    }
  };

  const handleScanSuccess = async (rollNo) => {
    setShowScanner(false);
    try {
      const res = await axios.post('http://localhost:5000/api/users/scan-id', { rollNo });
      setScanMessage(res.data.message);
      setTokens(res.data.tokens);
      setTimeout(() => setScanMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Scan failed');
    }
  };

  const modules = [
    {
      title: 'Daily ID Scan',
      description: 'Scan your college ID to earn tokens',
      icon: '📱',
      color: 'from-blue-500 to-cyan-500',
      action: () => setShowScanner(true),
      buttonText: 'Scan Now',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 animate-gradient-xy">
      {/* Animated background blobs - ensure they don't block clicks */}
      <div className="fixed w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 -left-10 pointer-events-none"></div>
      <div className="fixed w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-0 right-0 pointer-events-none"></div>
      <div className="fixed w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 bottom-20 left-20 pointer-events-none"></div>

      {/* Instructions Modal (first time) */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-lg max-w-md">
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
          </div>
        </div>
      )}

      {/* ID Scanner Modal */}
      {showScanner && (
        <IDScanner
          onClose={() => setShowScanner(false)}
          onSuccess={handleScanSuccess}
        />
      )}

      {/* Floating success message */}
      {scanMessage && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {scanMessage}
        </div>
      )}

      {/* Navbar */}
      <nav className="relative z-20 glass text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                StudySnap
              </h1>
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
              {/* Streak and tokens */}
              <div className="hidden sm:flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                <span className="text-yellow-300">🔥</span>
                <span className="text-white font-semibold">{streak}</span>
                <span className="text-yellow-300 ml-2">🪙</span>
                <span className="text-white font-semibold">{tokens}</span>
              </div>

              {/* Notifications button with dropdown */}
              <div className="relative z-30">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="text-white/80 hover:text-white relative cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  <span className="text-xl">🔔</span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-64 glass rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 text-white border-b border-white/20">Notifications</div>
                    <div className="px-4 py-2 text-white/80 text-sm">📚 New quiz available</div>
                    <div className="px-4 py-2 text-white/80 text-sm">🔥 You have a 5‑day streak!</div>
                    <div className="px-4 py-2 text-white/80 text-sm">🎥 New video uploaded</div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative z-30">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 text-white/90 hover:text-white cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline">{user?.username}</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 glass rounded-lg shadow-lg py-1 z-50">
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name || user?.username}!
          </h2>
          <p className="text-white/80">Ready to learn and earn today?</p>
        </div>

        {/* Quick stats mobile */}
        <div className="sm:hidden flex justify-between glass p-4 rounded-lg mb-6">
          <div className="text-center">
            <div className="text-yellow-300 text-xl">🔥</div>
            <div className="text-white font-bold">{streak}</div>
            <div className="text-white/60 text-xs">Streak</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-300 text-xl">🪙</div>
            <div className="text-white font-bold">{tokens}</div>
            <div className="text-white/60 text-xs">Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-green-300 text-xl">✓</div>
            <div className="text-white font-bold">{checkedIn ? 'Done' : 'Pending'}</div>
            <div className="text-white/60 text-xs">Check-in</div>
          </div>
        </div>

        {/* Daily check-in card (if not checked in) */}
        {!checkedIn && (
          <div className="glass p-6 rounded-lg mb-8 flex flex-col sm:flex-row justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">Daily Check-in</h3>
              <p className="text-white/70">Check in now to maintain your streak and earn 10 tokens!</p>
            </div>
            <button
              onClick={handleCheckin}
              className="mt-4 sm:mt-0 bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-500 hover:to-blue-600 transition transform hover:scale-105"
            >
              Check In 🔥
            </button>
          </div>
        )}

        {/* Modules grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, idx) => (
            <div
              key={idx}
              className="group relative glass rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${module.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
              <div className="p-6">
                <div className="text-4xl mb-4">{module.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{module.title}</h3>
                <p className="text-white/70 text-sm mb-4">{module.description}</p>
                {module.action ? (
                  <button
                    onClick={module.action}
                    disabled={module.disabled}
                    className={`w-full bg-gradient-to-r ${module.color} text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105 disabled:opacity-50`}
                  >
                    {module.buttonText}
                  </button>
                ) : (
                  <Link
                    to={module.link}
                    className={`block text-center bg-gradient-to-r ${module.color} text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105`}
                  >
                    {module.buttonText}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Activity feed */}
        <div className="mt-12 glass rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-white/80">
              <span className="text-green-400">✓</span>
              <span>Completed JavaScript Quiz</span>
              <span className="text-xs text-white/50">2h ago</span>
            </div>
            <div className="flex items-center space-x-3 text-white/80">
              <span className="text-blue-400">📄</span>
              <span>Uploaded "React Notes" to E-Library</span>
              <span className="text-xs text-white/50">yesterday</span>
            </div>
            <div className="flex items-center space-x-3 text-white/80">
              <span className="text-yellow-400">🔥</span>
              <span>7-day streak achieved!</span>
              <span className="text-xs text-white/50">2 days ago</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}