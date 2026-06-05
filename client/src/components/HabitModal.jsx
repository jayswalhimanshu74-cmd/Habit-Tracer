import  { useState } from 'react';
import { X } from 'lucide-react';
import { habitService } from '../services/api';

const HabitModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [title, setTitle]             = useState(initialData?.title||'');
  const [category, setCategory]       = useState(initialData?.category||'General');
  const [difficulty, setDifficulty]   = useState(initialData?.difficulty||'Medium'); 
  const [reminderTime, setReminderTime] = useState(initialData?.reminder_time||'');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // ✅ Exact match with server/utils/validators.js — single source of truth
  const categories   = ['General', 'Health', 'Fitness', 'Learning', 'Mindfulness', 'Productivity', 'Social', 'Finance'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    try {
      if (initialData) {
        await habitService.updateHabit(initialData.id, {
          title, category, difficulty, reminder_time: reminderTime || null
        });
      } else {
        await habitService.createHabit({
          title, category, difficulty, reminder_time: reminderTime || null
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${initialData ? 'update' : 'create'} habit`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative glass w-full max-w-md p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/50">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={20} className="text-slate-500" />
        </button>

        <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">
          {initialData ? 'Edit Habit' : 'New Habit'}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning run"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Difficulty ✅ */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Reminder time */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Reminder time <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black tracking-widest uppercase hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Habit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HabitModal;