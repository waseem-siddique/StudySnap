import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import Background from '../components/Background';

export default function Quiz() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/quizzes');
      setQuizzes(res.data);
    } catch (err) {
      console.error('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quiz) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/quizzes/${quiz._id}`);
      setSelectedQuiz(res.data);
      setAnswers(new Array(res.data.questions.length).fill(null));
      setCurrentQuestion(0);
      setScore(null);
      setResults([]);
      if (res.data.timeLimit > 0) {
        setTimeLeft(res.data.timeLimit * 60);
      }
    } catch (err) {
      alert('Failed to load quiz');
    }
  };

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswer = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < selectedQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) {
      if (!window.confirm('You have unanswered questions. Submit anyway?')) {
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/quizzes/${selectedQuiz._id}/submit`, {
        answers
      });
      setScore(res.data.score);
      setResults(res.data.results);
    } catch (err) {
      alert('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const exitQuiz = () => {
    setSelectedQuiz(null);
    setAnswers([]);
    setScore(null);
    setResults([]);
    setTimeLeft(null);
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

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
          <AnimatePresence mode="wait">
            {!selectedQuiz ? (
              // Quiz list view
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-3xl font-bold text-white mb-6">Quizzes</h1>
                {loading ? (
                  <div className="text-center text-white">Loading quizzes...</div>
                ) : (
                  <motion.div
                    variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {quizzes.map(quiz => (
                      <motion.div
                        key={quiz._id}
                        variants={itemVariants}
                        whileHover={{ y: -5, transition: { duration: 0.15 } }}
                        className="glass rounded-xl p-6 hover:shadow-2xl transition-shadow duration-300"
                      >
                        <h3 className="text-xl font-semibold text-white mb-2">{quiz.title}</h3>
                        <p className="text-white/70 text-sm mb-3">{quiz.description}</p>
                        <div className="flex justify-between items-center text-sm text-white/60 mb-4">
                          <span>{quiz.questions?.length || 0} questions</span>
                          <span>{quiz.totalPoints || 0} points</span>
                        </div>
                        {quiz.course && (
                          <span className="inline-block bg-purple-500/30 text-purple-200 text-xs px-2 py-1 rounded-full mb-4">
                            {quiz.course.name}
                          </span>
                        )}
                        <button
                          onClick={() => startQuiz(quiz)}
                          className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition transform hover:scale-105"
                        >
                          Start Quiz
                        </button>
                      </motion.div>
                    ))}
                    {quizzes.length === 0 && (
                      <div className="col-span-full text-center text-white/70 py-8">No quizzes available.</div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ) : score !== null ? (
              // Quiz results view
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="glass rounded-xl p-6 md:p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Quiz Results</h2>
                  <button
                    onClick={exitQuiz}
                    className="text-white/80 hover:text-white flex items-center space-x-1"
                  >
                    <span className="text-lg">←</span>
                    <span>Back to Quizzes</span>
                  </button>
                </div>
                <div className="text-center mb-8">
                  <div className="text-5xl font-bold text-white mb-2">{score} / {selectedQuiz.totalPoints}</div>
                  <p className="text-white/70">You scored {((score / selectedQuiz.totalPoints) * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-4">
                  {results.map((r, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-4 rounded-lg ${r.isCorrect ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}
                    >
                      <p className="text-white font-medium mb-2">Q{idx+1}: {r.question}</p>
                      <p className="text-white/80 text-sm">Your answer: Option {r.selected + 1}</p>
                      <p className="text-white/80 text-sm">Correct answer: Option {r.correct + 1}</p>
                      <p className="text-white/80 text-sm mt-1">Points: {r.points}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              // Quiz taking view
              <motion.div
                key="taking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="glass rounded-xl p-6 md:p-8"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={exitQuiz}
                      className="text-white/80 hover:text-white flex items-center space-x-1"
                    >
                      <span className="text-lg">←</span>
                      <span>Quizzes</span>
                    </button>
                    <h2 className="text-2xl font-bold text-white">{selectedQuiz.title}</h2>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center space-x-4">
                    {timeLeft !== null && (
                      <div className={`text-lg font-mono ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                        ⏱️ {formatTime(timeLeft)}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-4">{selectedQuiz.description}</p>
                <div className="mb-4 text-white/70">
                  Question {currentQuestion + 1} of {selectedQuiz.questions.length}
                </div>
                <div className="mb-6">
                  <p className="text-white text-lg mb-4">{selectedQuiz.questions[currentQuestion].questionText}</p>
                  <div className="space-y-3">
                    {selectedQuiz.questions[currentQuestion].options.map((opt, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(idx)}
                        className={`w-full text-left p-3 rounded-lg transition ${
                          answers[currentQuestion] === idx
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/20 text-white/80 hover:bg-white/30'
                        }`}
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={prevQuestion}
                    disabled={currentQuestion === 0}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg disabled:opacity-50 hover:bg-white/30 transition"
                  >
                    Previous
                  </motion.button>
                  {currentQuestion < selectedQuiz.questions.length - 1 ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={nextQuestion}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
                    >
                      Next
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg font-semibold hover:from-green-500 hover:to-blue-600 transition disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </motion.div>
    </Background>
  );
}