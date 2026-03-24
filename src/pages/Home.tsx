import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Filter, Loader2, Wrench, Zap, Droplets, ThermometerSnowflake, Refrigerator, LayoutGrid, Map as MapIcon, Sparkles } from 'lucide-react';
import { db, collection, getDocs, onSnapshot, query, where, Timestamp, setDoc, doc, handleFirestoreError, OperationType, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Technician, UserLocation } from '../types';
import { haversine } from '../utils/haversine';
import TechCard from '../components/TechCard';
import BookingModal from '../components/BookingModal';
import TechnicianMap from '../components/TechnicianMap';
import AIAssistant from '../components/AIAssistant';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  { id: 'all', name: 'All Services', icon: Wrench },
  { id: 'electrician', name: 'Electrician', icon: Zap },
  { id: 'plumber', name: 'Plumber', icon: Droplets },
  { id: 'ac', name: 'AC Repair', icon: ThermometerSnowflake },
  { id: 'fridge', name: 'Fridge Repair', icon: Refrigerator },
];

export default function Home() {
  const [user] = useAuthState(auth);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
          // Fallback to a default location (e.g., Mumbai)
          setUserLocation({ lat: 19.0760, lng: 72.8777 });
        }
      );
    }
  }, []);

  // Fetch technicians
  useEffect(() => {
    const q = query(collection(db, 'technicians'), where('online', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const techs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Technician[];
      
      if (techs.length === 0) {
        setLoading(false);
      } else {
        setTechnicians(techs);
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'technicians');
    });

    return () => unsubscribe();
  }, [user]);

  const filteredTechs = useMemo((): (Technician & { distance: number })[] => {
    return technicians
      .filter(tech => {
        const matchesCategory = selectedCategory === 'all' || tech.category === selectedCategory;
        const matchesSearch = tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tech.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .map(tech => ({
        ...tech,
        distance: userLocation ? haversine(userLocation.lat, userLocation.lng, tech.location.lat, tech.location.lng) : 0
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [technicians, selectedCategory, searchQuery, userLocation]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-zinc-900 py-20 text-white sm:py-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -left-1/4 -top-1/4 h-[150%] w-[150%] opacity-20"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#10b981,transparent_70%)]" />
          </motion.div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl"
            >
              Expert Repairs, <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Right at Your Door.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-8 max-w-2xl text-xl text-zinc-400"
            >
              Find verified electricians, plumbers, and technicians near you. Fast service, transparent pricing, and trusted professionals.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12 flex w-full max-w-3xl flex-col gap-4 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={22} />
                <input
                  type="text"
                  placeholder="What service do you need today?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 w-full rounded-2xl bg-white/10 pl-14 pr-6 text-lg text-white backdrop-blur-md outline-none ring-1 ring-white/20 transition-all focus:bg-white/20 focus:ring-emerald-500/50"
                />
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-md ring-1 ring-white/20">
                <MapPin size={22} className="text-emerald-500" />
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Your Location</p>
                  <p className="text-sm font-semibold text-zinc-200">
                    {userLocation ? 'Mumbai, India' : 'Detecting...'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <div className="sticky top-16 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 overflow-x-auto py-5 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-shrink-0 items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-300 active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 ring-4 ring-emerald-500/10'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                <cat.icon size={20} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-4xl font-extrabold text-zinc-900">
              {selectedCategory === 'all' ? 'Top Professionals' : `${CATEGORIES.find(c => c.id === selectedCategory)?.name}s`}
            </h2>
            <p className="mt-2 text-zinc-500">Showing the best rated experts in your area</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-2xl bg-zinc-100 p-1.5 ring-1 ring-zinc-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                <LayoutGrid size={16} />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  viewMode === 'map' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                <MapIcon size={16} />
                <span>Map</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-emerald-600" size={48} />
            <p className="text-zinc-500">Finding best professionals for you...</p>
          </div>
        ) : filteredTechs.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredTechs.map((tech) => (
                  <TechCard
                    key={tech.id}
                    technician={tech}
                    distance={tech.distance}
                    onBook={(t) => setSelectedTech(t)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl"
            >
              <TechnicianMap
                technicians={filteredTechs}
                userLocation={userLocation}
                onSelectTech={(t) => setSelectedTech(t)}
              />
            </motion.div>
          )
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 bg-white p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
              <Search size={32} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900">No professionals found</h3>
            <p className="mt-2 text-zinc-500">Try adjusting your search or category filters.</p>
          </div>
        )}
      </main>

      <BookingModal
        technician={selectedTech}
        onClose={() => setSelectedTech(null)}
        onSuccess={() => {
          // Refresh or show success
        }}
        userLocation={userLocation || undefined}
        distance={selectedTech?.distance}
      />
      <AIAssistant userLocation={userLocation} />
    </div>
  );
}
