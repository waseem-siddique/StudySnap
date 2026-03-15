import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import Background from '../components/Background';
import ClickSpark from '../components/ClickSpark';

export default function VideoLibrary() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVideos();
    fetchProfessors();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/videos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(res.data);
    } catch (err) {
      setError('Failed to load videos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/professors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfessors(res.data);
    } catch (err) {
      console.error('Failed to fetch professors');
    }
  };

  const filteredVideos = selectedProfessor
    ? videos.filter(v => v.professor?._id === selectedProfessor)
    : videos;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <ClickSpark>
    <Background>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
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
              <Link to="/profile" className="text-white/80 hover:text-white">Profile</Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-6">Video Lectures</h1>

          {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4">{error}</div>}

          <div className="mb-6">
            <select
              value={selectedProfessor}
              onChange={(e) => setSelectedProfessor(e.target.value)}
              className="w-full md:w-64 px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">All Professors</option>
              {professors.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center text-white">Loading videos...</div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredVideos.map(video => (
                  <motion.div
                    key={video._id}
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-1">{video.title}</h3>
                      <p className="text-white/60 text-sm mb-2">by {video.professor?.name}</p>
                      {video.course && (
                        <span className="inline-block bg-blue-500/30 text-blue-200 text-xs px-2 py-1 rounded-full mb-2">
                          {video.course.name}
                        </span>
                      )}
                      <p className="text-white/70 text-sm mb-3 line-clamp-2">{video.description}</p>
                      <video
                        src={`http://localhost:5000${video.url}`}
                        controls
                        className="w-full rounded max-h-48"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden text-red-300 text-sm mt-2">Video failed to load.</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredVideos.length === 0 && (
                <p className="col-span-full text-center text-white/70 py-8">No videos available.</p>
              )}
            </motion.div>
          )}
        </main>
      </motion.div>
    </Background>
    </ClickSpark>
  );
}