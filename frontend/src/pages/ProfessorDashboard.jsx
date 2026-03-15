import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import Background from '../components/Background';

export default function ProfessorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Upload form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Videos list state
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  // Stats
  const [totalVideos, setTotalVideos] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);

  // Profile menu
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    // If user is not a professor, redirect to student dashboard
    if (user && user.role !== 'professor') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.college?._id) {
      fetchCourses();
      fetchMyVideos();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/courses?college=${user.college._id}`);
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to fetch courses');
    }
  };

  const fetchMyVideos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/videos/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(res.data);
      // Calculate stats
      setTotalVideos(res.data.length);
      setPendingCount(res.data.filter(v => v.approved === false).length);
      setApprovedCount(res.data.filter(v => v.approved === true).length);
    } catch (err) {
      console.error('Failed to fetch videos');
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      alert('Please select a video file');
      return;
    }
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('courseId', courseId);

    setUploading(true);
    setUploadSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/videos/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      setUploadSuccess('Video uploaded! Pending approval.');
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setCourseId('');
      fetchMyVideos(); // refresh list and stats
      // Reset file input
      document.getElementById('videoFile').value = '';
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadSuccess(''), 3000);
    }
  };

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

    const getStatusBadge = (approved) => {
    if (approved === true) return { text: '✅ Approved', color: 'bg-green-500/20 text-green-200' };
    if (approved === false) return { text: 'Awaiting/Rejected ❌ ', color: 'bg-red-500/20 text-red-200' };
    return { text: '⏳ Pending', color: 'bg-yellow-500/20 text-yellow-200' };
    };

  if (!user || user.role !== 'professor') {
    return null; // will redirect via useEffect
  }

  return (
    <Background>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Navbar */}
        <nav className="relative z-20 glass text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Logo />
                <span className="text-white/50 text-sm">Professor Panel</span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative z-30">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 text-white/90 hover:text-white cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:inline">{user?.name}</span>
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
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white mb-6"
          >
            Professor Dashboard
          </motion.h1>

          {/* Stats Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8"
          >
            <motion.div variants={itemVariants} className="glass p-6 rounded-lg">
              <div className="text-3xl mb-2">🎥</div>
              <div className="text-2xl font-bold text-white">{totalVideos}</div>
              <div className="text-white/70">Total Uploads</div>
            </motion.div>
            <motion.div variants={itemVariants} className="glass p-6 rounded-lg">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-2xl font-bold text-white">{pendingCount}</div>
              <div className="text-white/70">Pending Approval</div>
            </motion.div>
            <motion.div variants={itemVariants} className="glass p-6 rounded-lg">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-white">{approvedCount}</div>
              <div className="text-white/70">Approved</div>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Form */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="glass rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Upload Lecture Video</h2>
              <AnimatePresence>
                {uploadSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-2 rounded mb-4"
                  >
                    {uploadSuccess}
                  </motion.div>
                )}
              </AnimatePresence>
              <form onSubmit={handleUpload} className="space-y-4">
                <motion.div variants={itemVariants}>
                  <label className="block text-white/80 text-sm mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-white/80 text-sm mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-white/80 text-sm mb-1">Video File</label>
                  <input
                    id="videoFile"
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleFileChange}
                    className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                    required
                  />
                  <p className="text-xs text-white/50 mt-1">Max size: 100MB. Supported formats: MP4, WebM, OGG, MOV</p>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-white/80 text-sm mb-1">Course</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  >
                    <option value="" className="bg-gray-800 text-white">Select a course</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id} className="bg-gray-800 text-white">
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 transition"
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </motion.button>
              </form>
            </motion.div>

            {/* My Videos List */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="glass rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">My Uploaded Videos</h2>
              {loadingVideos ? (
                <div className="text-center text-white/70 py-8">Loading...</div>
              ) : videos.length === 0 ? (
                <p className="text-white/70 text-center py-8">No videos uploaded yet.</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {videos.map((video, index) => {
                      const badge = getStatusBadge(video.approved);
                      return (
                        <motion.div
                          key={video._id}
                          custom={index}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-white/10 p-4 rounded-lg"
                        >
                          <h3 className="text-white font-semibold">{video.title}</h3>
                          <p className="text-white/70 text-sm mb-2">{video.description}</p>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white/50">
                              Course: {video.course?.name || 'N/A'}
                            </span>
                            <span className={`px-2 py-1 rounded-full ${badge.color}`}>
                              {badge.text}
                            </span>
                          </div>
                          <video
                            src={`http://localhost:5000${video.url}`}
                            controls
                            className="mt-3 w-full rounded max-h-40"
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>

          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 glass rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-2">📌 Quick Tips</h3>
            <ul className="text-white/70 space-y-1 list-disc list-inside">
              <li>Videos are hidden from students until approved by an admin.</li>
              <li>You can upload multiple videos for the same course.</li>
              <li>Check the status badge next to each video to know its approval state.</li>
              <li>Students will see your approved videos on your profile page and in the video library.</li>
              <li>Maximum video size is 100MB – compress if needed.</li>
            </ul>
          </motion.div>
        </main>
      </motion.div>
    </Background>
  );
}