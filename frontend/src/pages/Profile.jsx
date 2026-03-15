import React, { useState, useEffect, Component } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import Background from '../components/Background';

// Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('🔥 Profile Error Boundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 flex items-center justify-center p-4">
          <div className="glass p-6 rounded-lg max-w-lg text-center">
            <h2 className="text-2xl text-white mb-4">Something went wrong</h2>
            <p className="text-white/70 mb-4">{this.state.error?.message}</p>
            <pre className="text-left text-xs text-red-300 bg-black/50 p-2 rounded mb-4 overflow-auto max-h-40">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProfileContent() {
  const { user, logout, refreshUser } = useAuth();
  const { userId } = useParams(); // for viewing other profiles
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(!!userId);
  const [error, setError] = useState('');

  // For own profile editing
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    college: '',
    course: ''
  });
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dataReady, setDataReady] = useState(false);

  // For professor profile editing
  const [allCourses, setAllCourses] = useState([]);
  const [profFormData, setProfFormData] = useState({
    name: '',
    courses: []
  });

  const isOwnProfile = !userId || userId === user?.id;
  const currentRole = userId ? profile?.role : user?.role;

  useEffect(() => {
    if (userId && user) {
      fetchProfile();
    } else if (user && isOwnProfile) {
      if (user.role === 'student') {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          username: user.username || '',
          college: user.college?._id || '',
          course: user.course?._id || ''
        });
        setDataReady(true);
        fetchColleges();
      } else if (user.role === 'professor') {
        setProfFormData({
          name: user.name || '',
          courses: user.courses?.map(c => c._id) || []
        });
        fetchAllCourses(user.college?._id);
        setDataReady(true);
      }
    }
  }, [userId, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('complete') === 'true') {
      alert('Please complete your profile to continue.');
    }
  }, [location]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
    } catch (err) {
      setError('Failed to load profile. User may not exist.');
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/colleges');
      setColleges(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch colleges', err);
    }
  };

  const fetchCourses = async (collegeId) => {
    if (!collegeId) {
      setCourses([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/courses?college=${collegeId}`);
      setCourses(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch courses', err);
    }
  };

  const fetchAllCourses = async (collegeId) => {
    if (!collegeId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/courses?college=${collegeId}`);
      setAllCourses(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch courses', err);
    }
  };

  useEffect(() => {
    if (formData.college) {
      fetchCourses(formData.college);
    } else {
      setCourses([]);
    }
  }, [formData.college]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'college') setFormData(prev => ({ ...prev, course: '' }));
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.put('http://localhost:5000/api/users/profile', {
        name: formData.name,
        college: formData.college,
        course: formData.course
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      const params = new URLSearchParams(location.search);
      if (params.get('complete') === 'true') {
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    } finally {
      setUpdating(false);
    }
  };

  const handleProfessorSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.put('http://localhost:5000/api/users/professor/profile', {
        name: profFormData.name,
        courses: profFormData.courses
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    } finally {
      setUpdating(false);
    }
  };

  const handleConnect = async () => {
    try {
      await axios.post(`http://localhost:5000/api/connections/request/${profile.username}`);
      alert('Connection request sent!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send request');
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  // Loading states
  if (loadingProfile) {
    return (
      <Background>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl animate-pulse">Loading profile...</div>
        </div>
      </Background>
    );
  }

  if (error) {
    return (
      <Background>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass p-6 rounded-lg text-center">
            <p className="text-white/70 text-lg">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded"
            >
              Go Back
            </button>
          </div>
        </div>
      </Background>
    );
  }

  // Render public profile (other user)
  if (!isOwnProfile && profile) {
    return (
      <Background>
        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
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
            <motion.div variants={itemVariants} className="glass rounded-2xl p-6 md:p-8 mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">{profile.name || profile.username}</h1>
              <p className="text-white/70">@{profile.username}</p>
              {profile.college && <p className="text-white/60 mt-2">🏛️ {profile.college.name}</p>}
              {profile.role === 'student' && profile.course && (
                <p className="text-white/60">📚 {profile.course.name} ({profile.course.code})</p>
              )}
              {profile.role === 'professor' && profile.courses?.length > 0 && (
                <p className="text-white/60">📚 {profile.courses.map(c => c.name).join(', ')}</p>
              )}
              <div className="flex space-x-3 mt-4">
                {profile.role === 'student' && !profile.isConnected && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConnect}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                  >
                    Connect
                  </motion.button>
                )}
                {profile.isConnected && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to={`/chat/${profile.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                      💬 Chat
                    </Link>
                  </motion.div>
                )}
                {profile.role === 'professor' && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to={`/chat/${profile.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                      💬 Message
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {profile.role === 'student' && profile.materials?.length > 0 && (
              <motion.div variants={itemVariants} className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">📄 Uploaded Study Materials</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.materials.map(mat => (
                    <div key={mat._id} className="bg-white/10 p-4 rounded">
                      <h3 className="text-white font-medium">{mat.title}</h3>
                      {mat.description && <p className="text-white/70 text-sm">{mat.description}</p>}
                      <a
                        href={`http://localhost:5000${mat.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:text-purple-200 text-sm inline-block mt-2"
                      >
                        View PDF →
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {profile.role === 'professor' && profile.videos?.length > 0 && (
              <motion.div variants={itemVariants} className="glass rounded-xl p-6 mt-6">
                <h2 className="text-xl font-semibold text-white mb-4">🎥 Lecture Videos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.videos.map(video => (
                    <div key={video._id} className="bg-white/10 p-4 rounded">
                      <h3 className="text-white font-medium">{video.title}</h3>
                      <p className="text-white/70 text-sm mb-2">{video.description}</p>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:text-purple-200 text-sm inline-block"
                      >
                        Watch Video →
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </main>
        </motion.div>
      </Background>
    );
  }

  // Own profile (editable)
  if (!dataReady || (user?.role === 'student' && colleges.length === 0)) {
    return (
      <Background>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl animate-pulse">Loading profile...</div>
        </div>
      </Background>
    );
  }

  return (
    <Background>
      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
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

        <main className="max-w-3xl mx-auto px-4 py-8">
          <motion.div variants={itemVariants} className="glass rounded-2xl p-6 md:p-8">
            <h1 className="text-3xl font-bold text-white mb-6">
              {user?.role === 'professor' ? 'Professor Profile' : 'Your Profile'}
            </h1>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-4 p-3 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-500/20 border border-green-500 text-green-100'
                    : 'bg-red-500/20 border border-red-500 text-red-100'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            {user?.role === 'student' ? (
              // Student Profile Form
              <form onSubmit={handleStudentSubmit} className="space-y-6">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    disabled
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white/70 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white/70 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">College</label>
                  <select
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  >
                    <option value="">Select College</option>
                    {colleges.map(col => (
                      <option key={col._id} value={col._id} className="bg-gray-800 text-white">{col.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Course</label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    disabled={!formData.college}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(crs => (
                      <option key={crs._id} value={crs._id} className="bg-gray-800 text-white">
                        {crs.name} ({crs.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="glass p-4 rounded-lg text-center">
                    <div className="text-yellow-300 text-2xl mb-1">🔥</div>
                    <div className="text-white font-bold">{user?.dailyStreak || 0}</div>
                    <div className="text-white/60 text-xs">Day Streak</div>
                  </div>
                  <Link to="/token-history" className="glass p-4 rounded-lg text-center hover:bg-white/10 transition">
                    <div className="text-yellow-300 text-2xl mb-1">🪙</div>
                    <div className="text-white font-bold">{user?.studyTokens || 0}</div>
                    <div className="text-white/60 text-xs">Study Tokens</div>
                  </Link>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </motion.button>
              </form>
            ) : (
              // Professor Profile Form
              <form onSubmit={handleProfessorSubmit} className="space-y-6">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={profFormData.name}
                    onChange={(e) => setProfFormData({ ...profFormData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white/70 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">College</label>
                  <input
                    type="text"
                    value={user?.college?.name || ''}
                    disabled
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white/70 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Courses You Teach</label>
                  <select
                    multiple
                    value={profFormData.courses}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                      setProfFormData({ ...profFormData, courses: selected });
                    }}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white h-32"
                  >
                    {allCourses.map(c => (
                      <option key={c._id} value={c._id} className="bg-gray-800 text-white">
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-white/50 mt-1">Hold Ctrl (Cmd on Mac) to select multiple</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="glass p-4 rounded-lg text-center">
                    <div className="text-3xl mb-2">📚</div>
                    <div className="text-white font-bold">{user?.courses?.length || 0}</div>
                    <div className="text-white/60 text-xs">Courses</div>
                  </div>
                  <div className="glass p-4 rounded-lg text-center">
                    <div className="text-3xl mb-2">🎥</div>
                    <div className="text-white font-bold">{user?.videosCount || 0}</div>
                    <div className="text-white/60 text-xs">Videos</div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </motion.button>
              </form>
            )}
          </motion.div>
        </main>
      </motion.div>
    </Background>
  );
}

// ✅ This is the default export
export default function Profile() {
  return (
    <ErrorBoundary>
      <ProfileContent />
    </ErrorBoundary>
  );
}