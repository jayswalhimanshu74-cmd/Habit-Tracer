import  { useState, useEffect } from 'react';
import { leaderboardService } from '../services/api';
import { Trophy, Crown, ArrowLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


   useEffect(() => {
  const load = async () => {
    try {
      const res = await leaderboardService.getLeaderboard();
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch leaderboard', err);
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <nav className="glass sticky top-0 z-50 px-8 py-6 mb-12 flex items-center gap-6 border-b border-white/50">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
          <Trophy className="text-amber-500" size={32} />
          Global Leaderboard
        </h1>
      </nav>

      <main className="max-w-3xl mx-auto px-8">
        <div className="glass rounded-[3rem] overflow-hidden border border-white/50 shadow-xl shadow-sky-100/50">
          <div className="p-10 bg-slate-900 text-white text-center">
            <Crown size={48} className="text-amber-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-4xl font-black mb-2 tracking-tight">The Elites</h2>
            <p className="text-slate-400 font-medium">Top consistent performers worldwide.</p>
          </div>

          {loading ? (
            <div className="p-20 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-2xl"></div>)}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((user, index) => (
                <div 
                  key={user.username} 
                  className={`p-6 flex items-center justify-between transition-all hover:bg-sky-50/50 cursor-pointer ${index < 3 ? 'bg-amber-50/20' : ''}`}
                  onClick={() => navigate(`/user/${user.username}`)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 flex items-center justify-center font-black text-xl rounded-2xl bg-white shadow-sm border border-slate-100">
                      {index === 0 ? <Crown className="text-amber-500" /> : index + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{user.name}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">@{user.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sky-600 mb-0.5">
                        <Star size={16} fill="currentColor" />
                        <span className="text-xl font-black">{user.total_points}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-sky-100 flex items-center justify-center text-sm font-black text-sky-500 bg-sky-50">
                      L{user.level}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
