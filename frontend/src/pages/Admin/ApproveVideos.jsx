import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function ApproveVideos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingVideos();
  }, []);

  const fetchPendingVideos = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/videos/pending');
      setVideos(res.data);
    } catch (err) {
      console.error('Failed to fetch pending videos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (videoId, approved) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/videos/${videoId}/approve`, { approved });
      fetchPendingVideos(); // Refresh list
    } catch (err) {
      alert('Failed to update video status');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 animate-gradient-xy">
      {/* Animated blobs */}
      <div className="fixed w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 -left-10"></div>
      <div className="fixed w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-0 right-0"></div>

      {/* Navbar */}
      <nav className="relative z-10 glass text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/admin" className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Approve Videos
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-white/80 hover:text-white">Back to Admin</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Pending Video Approvals</h1>

        {loading ? (
          <div className="text-center text-white">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {videos.map(video => (
              <div key={video._id} className="glass p-6 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">{video.title}</h3>
                    <p className="text-white/70 text-sm mb-2">{video.description}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-white/60 mb-2">
                      <span>By: {video.professor?.name}</span>
                      <span>Course: {video.course?.name} ({video.course?.code})</span>
                      <span>Uploaded: {new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 text-sm inline-block"
                    >
                      Watch Video →
                    </a>
                  </div>
                  <div className="flex space-x-2 mt-4 md:mt-0">
                    <button
                      onClick={() => handleApprove(video._id, true)}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-4 py-2 rounded-lg transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApprove(video._id, false)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {videos.length === 0 && (
              <div className="text-center text-white/70 py-8">No pending videos.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}