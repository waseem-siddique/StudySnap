import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function VideoLibrary() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVideos();
    fetchProfessors();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/videos');
      setVideos(res.data);
    } catch (err) {
      console.error('Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessors = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/professors');
      setProfessors(res.data);
    } catch (err) {
      console.error('Failed to fetch professors');
    }
  };

  const filteredVideos = selectedProfessor
    ? videos.filter(v => v.professor?._id === selectedProfessor)
    : videos;

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
        <h1 className="text-3xl font-bold text-white mb-6">Video Lectures</h1>
        <div className="mb-6">
          <select
            value={selectedProfessor}
            onChange={(e) => setSelectedProfessor(e.target.value)}
            className="w-full md:w-64 px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="" className="bg-gray-800 text-white">All Professors</option>
            {professors.map(p => (
              <option key={p._id} value={p._id} className="bg-gray-800 text-white">{p.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center text-white">Loading videos...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map(video => (
              <div key={video._id} className="glass rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="aspect-w-16 aspect-h-9 bg-black/50">
                  <div className="w-full h-40 bg-gradient-to-br from-purple-800 to-pink-800 flex items-center justify-center">
                    <span className="text-5xl">🎬</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-1">{video.title}</h3>
                  <p className="text-white/60 text-sm mb-2">by {video.professor?.name}</p>
                  {video.course && (
                    <span className="inline-block bg-blue-500/30 text-blue-200 text-xs px-2 py-1 rounded-full mb-2">
                      {video.course.name}
                    </span>
                  )}
                  <p className="text-white/70 text-sm mb-3 line-clamp-2">{video.description}</p>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-orange-600 transition"
                  >
                    Watch Video
                  </a>
                </div>
              </div>
            ))}
            {filteredVideos.length === 0 && (
              <div className="col-span-full text-center text-white/70 py-8">No videos available.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}