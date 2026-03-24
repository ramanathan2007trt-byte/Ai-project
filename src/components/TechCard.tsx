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
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 transition-all duration-300 hover:border-zinc-300 hover:shadow-md"
    >
      <div className="mb-5 flex items-start justify-between">
        <div className="flex gap-4">
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 border border-zinc-200">
            <img
              src={`https://picsum.photos/seed/${technician.id}/200/200`}
              alt={technician.name}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            {technician.online && (
              <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${technician.isBusy ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-900 tracking-tight">{technician.name}</h3>
              {technician.verified && (
                <ShieldCheck size={14} className="text-emerald-600" aria-label="Verified" />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <div className="flex items-center gap-1">
                <Star size={12} className="fill-amber-500 text-amber-500" />
                <span className="text-zinc-900 font-semibold">{technician.rating?.toFixed(1) || 'New'}</span>
                <span>({technician.totalJobs || 0})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="flex flex-col rounded-lg bg-zinc-50 p-3 border border-zinc-100">
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <Briefcase size={12} />
            <span className="text-xs font-medium text-zinc-500">Experience</span>
          </div>
          <span className="text-sm font-semibold text-zinc-900">{technician.experience || 0} Years</span>
        </div>
        <div className="flex flex-col rounded-lg bg-zinc-50 p-3 border border-zinc-100">
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <MapPin size={12} />
            <span className="text-xs font-medium text-zinc-500">Distance</span>
          </div>
          <span className="text-sm font-semibold text-zinc-900">{distance?.toFixed(1) || '?'} km</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-100">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-zinc-500">Starting at</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-zinc-900">₹{technician.basePrice}</span>
          </div>
        </div>
        <button
          onClick={() => onBook(technician)}
          disabled={technician.isBusy}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
            technician.isBusy 
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' 
              : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm'
          }`}
        >
          {technician.isBusy ? 'Busy' : 'Book Now'}
        </button>
      </div>
    </motion.div>
  );
};

export default TechCard;
