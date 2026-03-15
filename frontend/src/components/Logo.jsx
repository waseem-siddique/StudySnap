import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Logo() {
  const { user } = useAuth();
  const homePath = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <Link to={homePath} className="flex items-center space-x-3">
      <img src="/logo.png" alt="StudySnap" className="h-12 w-auto" />
      <span className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
        StudySnap
      </span>
    </Link>
  );
}