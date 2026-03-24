import React from 'react';
import { Star, MapPin, ShieldCheck, Briefcase } from 'lucide-react';
import { Technician } from '../types';
import { motion } from 'motion/react';

interface TechCardProps {
  technician: Technician;
  distance?: number;
  onBook: (tech: Technician) => void;
}

const TechCard: React.FC<TechCardProps> = ({ technician, distance, onBook }) => {
  const categoryColors = {
    electrician: 'bg-amber-50 text-amber-700 border-amber-100',
    plumber: 'bg-blue-50 text-blue-700 border-blue-100',
    ac: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    fridge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-zinc-200 bg-white p-6 transition-all duration-500 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/10"
    >
      <div className="mb-6 flex items-start justify-between">
        <div className="flex gap-5">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-100 shadow-inner">
            <img
              src={`https://picsum.photos/seed/${technician.id}/200/200`}
              alt={technician.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            {technician.online && (
              <div className={`absolute right-1.5 top-1.5 h-4 w-4 rounded-full border-2 border-white shadow-sm ${technician.isBusy ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">{technician.name}</h3>
              {technician.verified && (
                <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-500/20">
                  <ShieldCheck size={12} />
                  <span>Verified</span>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-zinc-900">{technician.rating?.toFixed(1) || 'New'}</span>
                <span className="text-xs text-zinc-400">({technician.totalJobs || 0} reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="flex flex-col rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100 transition-colors group-hover:bg-emerald-50/30 group-hover:ring-emerald-100">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Briefcase size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Experience</span>
          </div>
          <span className="text-sm font-bold text-zinc-700">{technician.experience || 0} Years</span>
        </div>
        <div className="flex flex-col rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100 transition-colors group-hover:bg-emerald-50/30 group-hover:ring-emerald-100">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <MapPin size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Distance</span>
          </div>
          <span className="text-sm font-bold text-zinc-700">{distance?.toFixed(1) || '?'} km away</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-100">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Starting at</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-zinc-900">₹{technician.basePrice}</span>
            <span className="text-xs text-zinc-400 font-medium">/visit</span>
          </div>
        </div>
        <button
          onClick={() => onBook(technician)}
          disabled={technician.isBusy}
          className={`relative overflow-hidden rounded-2xl px-8 py-3 text-sm font-bold transition-all duration-300 active:scale-95 ${
            technician.isBusy 
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' 
              : 'bg-zinc-900 text-white hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/20'
          }`}
        >
          {technician.isBusy ? 'Currently Busy' : 'Book Now'}
        </button>
      </div>
    </motion.div>
  );
};

export default TechCard;
