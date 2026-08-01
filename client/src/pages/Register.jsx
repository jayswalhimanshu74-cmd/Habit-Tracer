import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full glass p-10 rounded-[2.5rem] relative z-10 border border-white/50">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-6 animate-float">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Create Account</h2>
          <p className="text-slate-500 font-medium">Start your habit tracking journey today</p>
        </div>

        {error && (
          <div className="bg-red-50/50 text-red-600 p-4 rounded-2xl mb-6 text-sm border border-red-100 flex items-center gap-3 backdrop-blur-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Full Name</label>
            <input
              type="text"
              className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all duration-300 font-medium"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Email Address</label>
            <input
              type="email"
              className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all duration-300 font-medium"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Password</label>
            <input
              type="password"
              className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all duration-300 font-medium"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 rounded-2xl font-bold text-lg tracking-wide shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-slate-500 mt-10 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
