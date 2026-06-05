import{ useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { User, Flame, Share2, ArrowLeft, Star, LayoutGrid } from 'lucide-react';

const PublicProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
  const load = async () => {
    try {
      const res = await userService.getProfile(username);
      setProfile(res.data);
    } catch {
      setError('User not found');
    } finally {
      setLoading(false);
    }
  };
  load();
}, [username]); // ✅ re-runs when username changes

  const shareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Profile link copied to clipboard!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-2xl animate-pulse">Loading Profile...</div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
    <h2 className="text-4xl font-black mb-4">{error}</h2>
    <button onClick={() => navigate('/')} className="btn-gradient px-8 py-3 rounded-xl font-bold">Go Back</button>
  </div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <nav className="glass sticky top-0 z-50 px-8 py-6 mb-12 flex items-center justify-between border-b border-white/50">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <button 
          onClick={shareProfile}
          className="btn-gradient p-3 rounded-2xl text-white shadow-lg shadow-sky-200"
        >
          <Share2 size={24} />
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-8">
        <div className="glass p-12 rounded-[3rem] text-center mb-12 shadow-xl shadow-sky-100/50">
          <div className="w-32 h-32 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl animate-float">
            <User size={64} strokeWidth={2.5} />
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-2">{profile.name}</h2>
          <p className="text-slate-500 font-bold text-lg mb-8 tracking-widest uppercase">@{profile.username}</p>
          
          <div className="flex flex-wrap justify-center gap-6">
            <div className="glass px-8 py-4 rounded-2xl flex items-center gap-3">
              <Star className="text-sky-500" size={24} fill="currentColor" />
              <div>
                <p className="text-2xl font-black text-slate-900">{profile.stats.total_points}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</p>
              </div>
            </div>
            <div className="glass px-8 py-4 rounded-2xl flex items-center gap-3">
              <LayoutGrid className="text-purple-500" size={24} />
              <div>
                <p className="text-2xl font-black text-slate-900">{profile.habits.length}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Habits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-black text-slate-900 mb-6 px-4">Badges Earned</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {profile.badges.map((badge, i) => (
                <div key={i} className="glass p-6 rounded-[2rem] text-center group card-hover border border-white/50">
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                     <Star size={32} fill="currentColor" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">{badge.name}</h4>
                  <p className="text-[10px] font-medium text-slate-500">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habits */}
        <h3 className="text-2xl font-black text-slate-900 mb-6 px-4">Active Habits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {profile.habits.map((habit, i) => (
            <div key={i} className="glass p-8 rounded-[2.5rem] flex items-center justify-between border border-white/50 shadow-sm">
              <div>
                <span className="px-3 py-1 bg-slate-100 text-[10px] font-black text-slate-500 rounded-full uppercase tracking-widest mb-2 inline-block">{habit.category}</span>
                <h4 className="text-xl font-black text-slate-900">{habit.title}</h4>
              </div>
              <div className="text-center">
                 <Flame className="text-orange-500 mx-auto mb-1" size={24} fill="currentColor" />
                 <p className="text-lg font-black text-slate-900">Active</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PublicProfile;
