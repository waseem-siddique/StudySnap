import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ClickSpark from '../../components/ClickSpark';

export default function ManageProfessors() {
  const { user } = useAuth();
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfessors();
  }, []);

  const fetchProfessors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/professors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfessors(res.data);
    } catch (err) {
      setError('Failed to load professors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, approve) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/professors/${id}/approve`, { approved: approve }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProfessors();
    } catch (err) {
      alert('Failed to update professor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this professor?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/professors/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProfessors();
    } catch (err) {
      alert('Failed to delete professor');
    }
  };

  if (loading) return <div className="text-center text-white py-20">Loading professors...</div>;

  return (
    <ClickSpark sparkColor="#fff">
      <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900">
        <nav className="glass text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/admin" className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Manage Professors
              </Link>
              <Link to="/admin" className="text-white/80 hover:text-white">Back to Admin</Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-6">Professors</h1>
          {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4">{error}</div>}

          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-white">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">College</th>
                  <th className="px-6 py-3 text-left">Courses</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {professors.map(p => (
                  <tr key={p._id}>
                    <td className="px-6 py-4">{p.name}</td>
                    <td className="px-6 py-4">{p.email}</td>
                    <td className="px-6 py-4">{p.college?.name || '-'}</td>
                    <td className="px-6 py-4">{p.courses?.map(c => c.name).join(', ') || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={p.approved ? 'text-green-400' : 'text-yellow-400'}>
                        {p.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {!p.approved ? (
                        <button onClick={() => handleApproval(p._id, true)} className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-1 rounded mr-2">
                          Approve
                        </button>
                      ) : (
                        <button onClick={() => handleApproval(p._id, false)} className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1 rounded mr-2">
                          Revoke
                        </button>
                      )}
                      <button onClick={() => handleDelete(p._id)} className="text-red-300 hover:text-red-200">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {professors.length === 0 && <p className="text-center text-white/70 mt-4">No professors found.</p>}
        </main>
      </div>
    </ClickSpark>
  );
}