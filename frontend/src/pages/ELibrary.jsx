import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ClickSpark from '../components/ClickSpark';

export default function ELibrary() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tokens, setTokens] = useState(user?.studyTokens || 0);
  
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (user?.college?._id) {
      fetchCourses(user.college._id);
    }
  }, [user]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/materials');
      setMaterials(res.data);
    } catch (err) {
      console.error('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (collegeId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/courses?college=${collegeId}`);
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to fetch courses');
    }
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title || !courseId) {
      alert('Please provide title, course, and file');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('courseId', courseId);

    setUploading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.tokensEarned > 0) {
        alert(`Upload successful! You earned ${res.data.tokensEarned} tokens.`);
        setTokens(res.data.newTokenBalance);
      } else {
        alert('Upload successful! (No tokens earned – duplicate title)');
      }
      
      setTitle('');
      setDescription('');
      setFile(null);
      setCourseId('');
      fetchMaterials();
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/materials/${id}`);
      fetchMaterials();
    } catch (err) {
      alert('Failed to delete material');
    }
  };

  const handleEditClick = (material) => {
    setEditingMaterial(material);
    setEditTitle(material.title);
    setEditDescription(material.description || '');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      alert('Title cannot be empty');
      return;
    }
    setEditLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/materials/${editingMaterial._id}`, {
        title: editTitle,
        description: editDescription
      });
      setEditingMaterial(null);
      fetchMaterials();
    } catch (err) {
      alert('Failed to update material');
    } finally {
      setEditLoading(false);
    }
  };

  const filteredMaterials = materials.filter(mat =>
    mat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mat.uploadedBy?.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <Link to="/token-history" className="text-white/80 hover:text-white flex items-center space-x-1">
                  <span className="text-yellow-300">🪙</span>
                  <span>{tokens}</span>
                </Link>
                <Link to="/profile" className="text-white/80 hover:text-white">Profile</Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-6">E-Library</h1>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search materials by title or uploader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="glass rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Upload Study Material (PDF)</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                >
                  <option value="" className="bg-gray-800 text-white">Select Course (required)</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id} className="bg-gray-800 text-white">{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-500 hover:to-blue-600 transition transform hover:scale-105 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </button>
            </form>
          </div>

          {loading ? (
            <div className="text-center text-white">Loading materials...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map(mat => (
                <div key={mat._id} className="glass rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="text-3xl mb-2">📄</div>
                      <span className="text-xs text-white/50">{new Date(mat.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{mat.title}</h3>
                    {mat.description && <p className="text-white/70 text-sm mb-3">{mat.description}</p>}
                    <p className="text-white/60 text-xs mb-4">Uploaded by @{mat.uploadedBy?.username}</p>
                    {mat.course && (
                      <span className="inline-block bg-purple-500/30 text-purple-200 text-xs px-2 py-1 rounded-full mb-4">
                        {mat.course.name} ({mat.course.code})
                      </span>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <a
                        href={`http://localhost:5000${mat.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition"
                      >
                        View PDF
                      </a>
                      {user?.id === mat.uploadedBy?._id && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(mat)}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(mat._id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1 rounded-full text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredMaterials.length === 0 && (
                <div className="col-span-full text-center text-white/70 py-8">No materials found.</div>
              )}
            </div>
          )}
        </main>

        {editingMaterial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass p-6 rounded-lg max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Edit Material</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/90 text-sm mb-1">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/90 text-sm mb-1">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingMaterial(null)}
                    className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {editLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ClickSpark>
  );
}