import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';


const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass p-12 md:p-16 rounded-[3rem] border border-white/60 max-w-lg w-full text-center shadow-2xl relative z-10">
        <div className="w-24 h-24 btn-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-sky-200 animate-float">
          <Compass className="text-white" size={48} />
        </div>

        <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Page Not Found</h2>
        <p className="text-slate-500 font-medium mb-8">
          The page you are looking for doesn't exist or has been moved. Let's get you back on track!
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full btn-gradient py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-sky-200 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Home size={18} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
