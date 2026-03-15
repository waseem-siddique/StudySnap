import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import Background from '../components/Background';

export default function Chat() {
  const { userId } = useParams();
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchRecipient();
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRecipient = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecipient(res.data);
    } catch (err) {
      console.error('Failed to fetch recipient');
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/messages',
        { receiverId: userId, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send message');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size cannot exceed 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', userId);
    formData.append('content', '');

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
      fileInputRef.current.value = '';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.3, delay: custom * 0.1 }
    }),
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (loading) return (
    <Background>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading chat...</div>
      </div>
    </Background>
  );
  if (!recipient) return (
    <Background>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">User not found</div>
      </div>
    </Background>
  );

  return (
    <Background>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen"
      >
        {/* Navbar */}
        <nav className="relative z-20 glass text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <motion.div
                className="flex items-center space-x-4"
                variants={headerVariants}
                initial="hidden"
                animate="visible"
              >
                <Logo />
                {/* Back to Messages button */}
                <Link
                  to="/messages"
                  className="text-white/80 hover:text-white flex items-center space-x-1"
                >
                  <span className="text-lg">←</span>
                  <span className="hidden sm:inline">Messages</span>
                </Link>
              </motion.div>
              <motion.div
                variants={headerVariants}
                initial="hidden"
                animate="visible"
              >
                <Link to={`/profile/${userId}`} className="text-white/80 hover:text-white">
                  {recipient.name || recipient.username}
                </Link>
              </motion.div>
            </div>
          </div>
        </nav>

        {/* Main chat area */}
        <main className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-8rem)] flex flex-col">
          <motion.div
            className="glass rounded-xl flex-1 overflow-y-auto p-4 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {messages.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/70 text-center mt-10"
              >
                No messages yet. Start the conversation!
              </motion.p>
            ) : (
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg._id}
                    custom={index}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`flex mb-3 ${msg.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender._id === user.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {msg.sender._id !== user.id && (
                        <p className="text-xs text-white/50 mb-1">{msg.sender.name || msg.sender.username}</p>
                      )}
                      {msg.content && <p>{msg.content}</p>}
                      {msg.fileUrl && (
                        <div className="mt-1">
                          <p className="text-xs text-white/50">
                            {msg.sender._id === user.id ? 'You' : msg.sender.name || msg.sender.username} sent a PDF:
                          </p>
                          <a
                            href={`http://localhost:5000${msg.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-300 text-sm underline flex items-center mt-1"
                          >
                            📎 {msg.fileName || 'View PDF'}
                          </a>
                        </div>
                      )}
                      <p className="text-xs text-white/40 text-right mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </motion.div>

          <motion.form
            onSubmit={sendMessage}
            className="flex gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf"
              className="hidden"
            />
            <motion.button
              type="button"
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
              title="Attach PDF (max 5MB)"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>📁</span>
              <span className="hidden sm:inline">Attach PDF</span>
            </motion.button>
            <motion.button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Send
            </motion.button>
          </motion.form>
          {uploading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/70 text-sm mt-2"
            >
              Uploading PDF...
            </motion.p>
          )}
        </main>
      </motion.div>
    </Background>
  );
}