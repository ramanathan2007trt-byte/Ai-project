import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Loader2, Zap, Droplets, ThermometerSnowflake, Refrigerator, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { db, collection, onSnapshot, query, where, handleFirestoreError, OperationType, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Technician, UserLocation } from '../types';
import { haversine } from '../utils/haversine';
import TechCard from '../components/TechCard';
import BookingModal from '../components/BookingModal';
import TechnicianMap from '../components/TechnicianMap';
import AIAssistant from '../components/AIAssistant';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  { id: 'all', name: 'All Services', icon: LayoutGrid },
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
      <section className="relative bg-zinc-950 py-24 text-white sm:py-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl"
            >
              Professional Home Services, <br className="hidden sm:block" />
              <span className="text-emerald-500">On Demand.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 max-w-2xl text-base text-zinc-400 font-medium"
            >
              Connect with verified experts for repairs, maintenance, and installations. Fast, reliable, and transparent.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12 flex w-full max-w-3xl flex-col gap-4 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  placeholder="Search for a service or professional..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 w-full rounded-xl bg-white/5 pl-12 pr-4 text-white placeholder:text-zinc-500 border border-white/10 outline-none transition-all focus:border-zinc-500 focus:bg-white/10 focus:ring-1 focus:ring-zinc-500 text-sm font-medium"
                />
              </div>
              <div className="flex h-14 items-center gap-3 rounded-xl bg-white/5 px-5 border border-white/10">
                <MapPin size={20} className="text-emerald-500" />
                <div className="text-left">
                  <p className="text-[11px] font-semibold text-zinc-500">Location</p>
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
          <div className="flex items-center gap-3 overflow-x-auto py-4 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
              >
                <cat.icon size={16} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              {selectedCategory === 'all' ? 'Available Professionals' : `${CATEGORIES.find(c => c.id === selectedCategory)?.name} Professionals`}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Verified experts ready to help in your area</p>
          </div>
          
          <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 border border-zinc-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid size={16} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === 'map' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <MapIcon size={16} />
              <span>Map</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-zinc-900" size={32} />
            <p className="text-sm font-medium text-zinc-500">Loading professionals...</p>
          </div>
        ) : filteredTechs.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm h-[600px]"
            >
              <TechnicianMap
                technicians={filteredTechs}
                userLocation={userLocation}
                onSelectTech={(t) => setSelectedTech(t)}
              />
            </motion.div>
          )
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 mb-4 border border-zinc-200">
              <Search size={20} />
            </div>
            <h3 className="text-base font-semibold text-zinc-900">No professionals found</h3>
            <p className="mt-1 text-sm text-zinc-500">Try adjusting your search or category filters.</p>
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
