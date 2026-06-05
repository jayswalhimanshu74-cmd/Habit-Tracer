import React, { useState, useEffect,useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { habitService, dashboardService, challengeService, insightService } from '../services/api';
import { Plus, Flame, CheckCircle, Circle, Trash2, LogOut, Filter, Search, Trophy, Edit3, TrendingUp, Calendar,  Sparkles, BarChart3, Target, Medal, Share2, Star, Activity } from 'lucide-react';
import HabitModal from '../components/HabitModal';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useCallback } from 'react';


const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';
// ↑ also fixes the hardcoded URL (that's Bug covered later too)

const Dashboard = () => {
  const socketRef = useRef(null); // ← holds the socket instance
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [insights, setInsights] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('habits');
  const [togglingId, setTogglingId] = useState(null);



// ✅ Extract just the id — primitive value, stable reference
const userId = user?.id;

   const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchHabits = useCallback(async () => {
  try {
    const res = await habitService.getHabits();
    setHabits(res.data.data);
  } catch (err) {
    console.error('Failed to fetch habits', err);
  }
}, []);

const fetchStats = useCallback(async () => {
  try {
    const res = await dashboardService.getStats();
    setStats(res.data.data);
  } catch {
    console.error('Failed to fetch stats');
  }
}, []);

const fetchInsights = useCallback(async () => { // ✅ wrap in useCallback
  try {
    const res = await insightService.getSmartInsights();
    setInsights(res.data.data);
  } catch {
    console.error('Failed to fetch insights');
  }
}, []); // ✅ stable

const fetchData = useCallback(async () => {
  await Promise.all([fetchHabits(), fetchStats(), fetchInsights()]);
}, [fetchHabits, fetchStats, fetchInsights]);

  const fetchChallenge = async () => {
    try {
      const res = await challengeService.getToday();
      setChallenge(res.data.data);
    } catch (err) {
      console.error('Failed to fetch challenge', err);
    }
  };

  const handleCompleteChallenge = async () => {
    if (!challenge || challenge.completed) return;
    try {
      await challengeService.complete(challenge.id);
      fetchChallenge();
    } catch (err) {
      console.error('Failed to complete challenge', err);
    }
  };


  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    initialLoad();
  }, []);

   useEffect(() => {
    // Only connect once user is confirmed authenticated
    if (!userId) return;

    // Create socket inside the effect, store in ref
    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') }, // optional: send token
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('achievement', (data) => {
      showNotification(data.message, 'success');
    });

    socket.on('badgeEarned', (data) => {
      showNotification(`🏆 New Badge: ${data.name}!`, 'badge');
    });

    socket.on('statsUpdated', () => {
      fetchData();
    });

    // Proper cleanup: remove listeners AND disconnect
    return () => {
      socket.off('achievement');
      socket.off('badgeEarned');
      socket.off('statsUpdated');
      socket.disconnect(); // ← this was completely missing before
      socketRef.current = null;
    };
  }, [userId]); // re-runs if user changes (e.g. after login)


  const handleToggle = async (id) => {
    if (togglingId === id) return;
    setTogglingId(id);

    // Optimistic update
    const previousHabits = [...habits];
    setHabits(prev => prev.map(h => 
      h.id === id ? { ...h, completedToday: !h.completedToday } : h
    ));
    setHabits(prev => prev.map(h =>
    h.id === id ? { ...h, completedToday: !h.completedToday } : h
  ));

    try {
      await habitService.toggleHabit(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to load Challenge',err);
     setHabits(previousHabits);
      showNotification('Failed to update habit status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await habitService.deleteHabit(id);
        await fetchData();
      } catch (err) {
        console.error('Failed to delete habit', err);
      }
    }
  };

  const handleEdit = (habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  const filteredHabits = habits.filter(habit => {
    const matchesSearch = habit.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'completed' && habit.completedToday) || 
      (filter === 'pending' && !habit.completedToday);
    
    return matchesSearch && matchesFilter;
  });


  const progress = React.useMemo(() => {
    if (!habits || habits.length === 0) return 0;
    const completed = habits.filter(h => !!h.completedToday).length;
    return Math.round((completed / habits.length) * 100);
  }, [habits]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 relative overflow-x-hidden">
      {/* Toast Notification */}
     {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-xl font-bold text-sm transition-all ${
          notification.type === 'error'
            ? 'bg-red-500 text-white'       // ✅ error — red
            : notification.type === 'badge'
            ? 'bg-indigo-500 text-white'    // badge — indigo
            : 'bg-emerald-500 text-white'   // success — green
        }`}>
          {notification.message}
        </div>
      )}

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 px-8 py-4 flex justify-between items-center border-b border-white/50 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 btn-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200 animate-float">
             <CheckCircle className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Habit<span className="text-sky-500">Flow</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/leaderboard')}
            className="hidden md:flex items-center gap-2 font-bold text-slate-600 hover:text-sky-600 transition-colors"
          >
            <Trophy size={18} />
            Leaderboard
          </button>
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/50 rounded-xl border border-white/50 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-slate-700">{user?.name}</span>
          </div>
          <button 
            onClick={logout}
            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            title="Logout"
          >
            <LogOut size={24} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8">
        {/* Streak Risk Alert */}
        {insights && insights.risk?.riskLevel !== 'Low' && (
          <div className="mb-12 p-6 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-center gap-6 animate-pulse">
            <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
              <TrendingUp className="rotate-180" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-900 leading-tight">{insights.risk?.riskLevel} Streak Risk!</h3>
              <p className="text-rose-600 font-medium">You're at risk of losing streaks for: <span className="font-bold">{insights.risk?.atRiskHabits?.join(', ')}</span></p>
            </div>
          </div>
        )}

        {/* Motivation & Progress Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 glass p-10 rounded-[3rem] border border-white/50 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-sky-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                  {insights?.profile?.type || 'Member'}
                </span>
                <span className="text-slate-400 font-bold text-sm">Engagement: {insights?.engagement?.label || 'Growing'}</span>
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tight leading-tight">
                {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening"}, {user?.name}!
              </h2>
              <p className="text-xl text-slate-300 font-medium max-w-xl italic">
                "{habits.filter(h => h.completedToday).length === habits.length && habits.length > 0 
                  ? "Absolute Perfection! You've mastered the day." 
                  : "Every small step counts. Stay consistent, stay unstoppable."}"
              </p>
            </div>
          </div>

          <div className="glass p-10 rounded-[3rem] border border-white/50 flex flex-col items-center justify-center text-center shadow-xl shadow-sky-100/30">
            <div className="relative w-32 h-32 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle 
                  cx="64" cy="64" r="54" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="transparent" 
                  className="text-sky-500 transition-all duration-1000" 
                  strokeDasharray={339.3} 
                  strokeDashoffset={339.3 - (339.3 * progress) / 100} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 leading-none">{progress}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Goal</span>
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Daily Completion</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Keep the rings closed</p>
          </div>
        </div>

        {/* Daily Challenge */}
        {challenge && (
          <div className={`p-8 rounded-[2.5rem] mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border transition-all duration-500 ${
            challenge.completed ? 'bg-emerald-50 border-emerald-100' : 'glass border-sky-100 bg-sky-50/30 shadow-lg shadow-sky-100/50'
          }`}>
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
                challenge.completed ? 'bg-emerald-500 text-white' : 'bg-white text-sky-500'
              }`}>
                <Target size={32} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-black text-slate-900">{challenge.title}</h3>
                  {challenge.completed && <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">Completed</span>}
                </div>
                <p className="text-slate-600 font-medium">{challenge.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">+{challenge.points_reward}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reward</p>
              </div>
              <button 
                onClick={handleCompleteChallenge}
                disabled={challenge.completed}
                className={`px-8 py-4 rounded-2xl font-black text-sm transition-all duration-300 ${
                  challenge.completed ? 'bg-emerald-100 text-emerald-600 cursor-default' : 'btn-gradient text-white shadow-lg shadow-sky-200 hover:scale-105'
                }`}
              >
                {challenge.completed ? 'Claimed' : 'Complete Challenge'}
              </button>
            </div>
          </div>
        )}

        {/* Stats & Leaderboard Bar */}
        <div className="glass p-8 rounded-[3rem] border border-white/50 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-sky-50/50 to-white/50 shadow-xl shadow-sky-100/30">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-2xl animate-float">
              L{stats?.level || 1}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="text-amber-500" size={20} fill="currentColor" />
                <span className="text-2xl font-black text-slate-900">{stats?.points || 0} Points</span>
              </div>
              <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Mastering the Art of Discipline</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/leaderboard')} className="px-6 py-4 bg-white rounded-2xl font-black text-sm text-slate-900 border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" /> Leaderboard
            </button>
            <button onClick={() => {
              const url = `${window.location.origin}/user/${user.username}`;
              navigator.clipboard.writeText(url);
              alert('Profile link copied!');
            }} className="px-6 py-4 bg-white rounded-2xl font-black text-sm text-slate-900 border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-2">
              <Share2 size={18} className="text-sky-500" /> Share Profile
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-12 p-1.5 glass rounded-[2rem] w-fit">
          {[
            { id: 'habits', label: 'My Habits', icon: Activity },
            { id: 'analytics', label: 'Pro Analytics', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'habits' ? (
          <>
            {/* Badges Section */}
            {stats?.badges?.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-black text-slate-900 mb-6 px-4 flex items-center gap-3">
              <Medal className="text-amber-500" /> Unlocked Badges
            </h3>
            <div className="flex flex-wrap gap-6">
              {stats.badges.map((badge, i) => (
                <div key={i} className="glass p-4 pr-8 rounded-2xl flex items-center gap-4 border border-white/50">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                    <Star size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">{badge.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastered</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Smart Suggestions */}
        {insights?.suggestions?.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-black text-slate-900 mb-6 px-4 flex items-center gap-3">
              <Sparkles className="text-sky-500" /> Smart Suggestions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insights.suggestions.map((s, i) => (
                <div key={i} className="glass p-6 rounded-[2rem] border border-sky-100 bg-sky-50/20 relative overflow-hidden group hover:shadow-lg transition-all">
                  <span className="px-3 py-1 bg-white text-[10px] font-black text-sky-500 rounded-full uppercase tracking-widest mb-3 inline-block shadow-sm">Recommended</span>
                  <h4 className="text-lg font-black text-slate-900 mb-1">{s.title}</h4>
                  <p className="text-sm text-slate-600 font-medium mb-4">{s.description}</p>
                  <p className="text-[10px] font-bold text-sky-600 bg-sky-100/50 px-3 py-1 rounded-lg inline-block">" {s.reason} "</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Habits', value: stats?.totalHabits || 0, icon: BarChart3, color: 'text-sky-500', bg: 'bg-sky-50' },
            { label: 'Completions', value: stats?.totalCompletions || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Success Rate', value: `${stats?.overallCompletionRate || 0}%`, icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50' },
            { label: 'Best Streak', value: `${stats?.globalLongestStreak || 0}d`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
          ].map((stat, i) => (
            <div key={i} className="glass p-8 rounded-[2.5rem] border border-white/50 shadow-sm flex items-center gap-6 group hover:border-sky-200 transition-all">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="flex bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm">
            {['all', 'completed', 'pending'].map((t) => (
              <button key={t} onClick={() => setFilter(t)} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${filter === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search habits..." className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button onClick={() => { setEditingHabit(null); setIsModalOpen(true); }} className="btn-gradient p-4 rounded-2xl text-white shadow-lg shadow-sky-200 hover:scale-105 active:scale-95 transition-all">
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Habit List */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map(i => <div key={i} className="h-96 bg-white/40 rounded-[2.5rem] animate-pulse border border-white/50"></div>)}
          </div>
        ) : filteredHabits.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredHabits.map((habit) => (
              <div key={habit.id} className={`group glass p-8 rounded-[3.5rem] border-2 transition-all duration-500 relative overflow-hidden ${habit.completedToday ? 'bg-emerald-50/60 border-emerald-200/50 shadow-inner' : 'border-transparent hover:border-sky-200/50 hover:shadow-xl hover:shadow-sky-100/20'}`}>
                {/* Completion Background Effect */}
                {habit.completedToday && (
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                )}
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${habit.completedToday ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {habit.category}
                        </span>
                        <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm ${habit.difficulty === 'Easy' ? 'bg-blue-50 text-blue-600' : habit.difficulty === 'Hard' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {habit.difficulty}
                        </span>
                        {habit.completedToday && (
                          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                            <CheckCircle size={12} fill="currentColor" className="text-emerald-500" /> Completed
                          </span>
                        )}
                      </div>
                      <h3 className={`text-3xl font-black tracking-tight transition-all duration-300 ${habit.completedToday ? 'text-emerald-900 opacity-60' : 'text-slate-800'}`}>
                        {habit.title}
                      </h3>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <button onClick={() => handleEdit(habit)} className="p-3 text-slate-400 hover:text-sky-500 hover:bg-white rounded-2xl transition-all shadow-sm"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(habit.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-white rounded-2xl transition-all shadow-sm"><Trash2 size={18} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/60 p-5 rounded-3xl border border-white/50 shadow-sm group-hover:bg-white transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${habit.streak > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Flame size={14} fill={habit.streak > 0 ? "currentColor" : "none"} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Streak</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">{habit.streak} <span className="text-xs font-bold text-slate-400">Days</span></p>
                    </div>
                    <div className="bg-white/60 p-5 rounded-3xl border border-white/50 shadow-sm group-hover:bg-white transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-sky-100 text-sky-600 rounded-lg">
                          <TrendingUp size={14} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">{habit.completionRate}<span className="text-xs font-bold text-slate-400">%</span></p>
                    </div>
                  </div>

                  <div className="mb-8 p-6 bg-white/40 rounded-3xl border border-white/40 group-hover:bg-white/60 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Recent Activity</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-md">
                        {habit.last30Days?.filter(d => d.status).length}/30 Done
                      </span>
                    </div>
                    <div className="grid grid-cols-10 gap-1.5">
                      {habit.last30Days?.slice(-30).map((day, idx) => (
                        <div 
                          key={idx} 
                          title={day.date} 
                          className={`aspect-square rounded-[4px] transition-all duration-500 ${
                            day.status 
                              ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                              : 'bg-slate-200/60'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(habit.id)}
                    className={`w-full py-5 rounded-[2rem] font-black text-base tracking-widest uppercase transition-all duration-500 flex items-center justify-center gap-3 active:scale-95 ${
                      habit.completedToday 
                        ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200 hover:bg-emerald-600' 
                        : 'btn-gradient text-white shadow-xl shadow-sky-100 hover:shadow-sky-200'
                    }`}
                  >
                    {habit.completedToday ? (
                      <>
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <CheckCircle size={16} />
                        </div>
                        <span>Goal Met Today</span>
                      </>
                    ) : (
                      <>
                        <Circle size={20} strokeWidth={3} />
                        <span>Complete Habit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 glass rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><Filter className="text-slate-300" size={40} /></div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">No Habits Found</h3>
            <button onClick={() => {setSearchQuery(''); setFilter('all');}} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95">Clear All Filters</button>
          </div>
        )}
          </>
        ) : (
          <AnalyticsDashboard />
        )}
      </main>

      {isModalOpen && (
        <HabitModal 
          key={editingHabit ? `edit-${editingHabit.id}` : 'new'}
          isOpen={isModalOpen} 
          onClose={handleModalClose} 
          onSuccess={fetchData} 
          initialData={editingHabit}
        />
      )}
    </div>
  );
};

export default Dashboard;
