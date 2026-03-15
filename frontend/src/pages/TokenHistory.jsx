import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ClickSpark from '../components/ClickSpark';
import Logo from '../components/Logo';

export default function TokenHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'checkin': return '🔥';
      case 'scan': return '📱';
      case 'quiz': return '📝';
      case 'mission': return '🎯';
      case 'upload': return '📄';
      default: return '🪙';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'checkin': return 'Check‑in';
      case 'scan': return 'ID Scan';
      case 'quiz': return 'Quiz';
      case 'mission': return 'Mission';
      case 'upload': return 'PDF Upload';
      default: return type;
    }
  };

  return (
    <ClickSpark sparkColor="#fff">
      <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 animate-gradient-xy">
        {/* Animated blobs */}
        <div className="fixed w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 -left-10 pointer-events-none"></div>
        <div className="fixed w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-0 right-0 pointer-events-none"></div>
        <div className="fixed w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 bottom-20 left-20 pointer-events-none"></div>

        {/* Navbar */}
        <nav className="relative z-10 glass text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  <Logo />
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

        <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-6">Token Transaction History</h1>

          {/* Tip banner */}
          <div className="glass p-4 rounded-lg mb-6 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/30">
            <p className="text-white/90 text-center">
              💡 <span className="font-semibold">Tip:</span> Earn more tokens by checking in daily, scanning your ID, taking quizzes, and uploading study materials (5 tokens per new PDF)!
            </p>
          </div>

          {loading ? (
            <div className="text-center text-white">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="glass p-8 rounded-lg text-center">
              <p className="text-white/70 text-lg">No transactions yet.</p>
              <p className="text-white/50 mt-2">Earn tokens by checking in, scanning your ID, taking quizzes, or uploading study materials!</p>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {transactions.map(tx => (
                      <tr key={tx._id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(tx.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="flex items-center">
                            <span className="mr-2">{getTypeIcon(tx.type)}</span>
                            <span className="capitalize">{getTypeLabel(tx.type)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{tx.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-400">+{tx.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{tx.balanceAfter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </ClickSpark>
  );
}