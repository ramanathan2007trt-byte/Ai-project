import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, doc, onSnapshot, auth, handleFirestoreError, OperationType, updateDoc } from '../firebase';
import { Booking, Technician } from '../types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ArrowLeft, Loader2, Navigation, Phone, MessageSquare, ShieldCheck, Star, MapPin, Play, Square } from 'lucide-react';
import TrackingMap from '../components/TrackingMap';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function Tracking() {
  const { bookingId } = useParams();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (!bookingId || !user) return;

    const unsubscribeBooking = onSnapshot(doc(db, 'bookings', bookingId), (snapshot) => {
      if (!snapshot.exists()) {
        toast.error('Booking not found');
        navigate('/history');
        return;
      }
      const bData = snapshot.data() as Booking;
      setBooking({ id: snapshot.id, ...bData });

      // Fetch technician
      const unsubscribeTech = onSnapshot(doc(db, 'technicians', bData.technicianId), (techSnapshot) => {
        if (techSnapshot.exists()) {
          setTechnician({ id: techSnapshot.id, ...techSnapshot.data() } as Technician);
        }
        setLoading(false);
      });

      return () => unsubscribeTech();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `bookings/${bookingId}`);
    });

    return () => unsubscribeBooking();
  }, [bookingId, user, navigate]);

  // Simulation logic
  useEffect(() => {
    let interval: any;
    if (simulating && technician && booking) {
      const startLat = technician.location.lat;
      const startLng = technician.location.lng;
      // Simulate moving towards a target (user's location or a nearby point)
      // For demo, we'll just move it slightly every 2 seconds
      let step = 0;
      interval = setInterval(async () => {
        step += 0.0005;
        const newLat = startLat + step;
        const newLng = startLng + step;
        
        try {
          await updateDoc(doc(db, 'technicians', technician.id), {
            currentLocation: { lat: newLat, lng: newLng }
          });
        } catch (error) {
          console.error('Simulation update error:', error);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [simulating, technician, booking]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-zinc-50">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
        <p className="text-zinc-500">Connecting to technician's GPS...</p>
      </div>
    );
  }

  if (!booking || !technician) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-zinc-50 lg:flex-row">
      {/* Sidebar Info */}
      <div className="z-10 w-full overflow-y-auto border-b border-zinc-200 bg-white p-6 shadow-xl lg:h-full lg:w-96 lg:border-b-0 lg:border-r">
        <Link
          to="/history"
          className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft size={16} />
          <span>Back to Bookings</span>
        </Link>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-zinc-900">Live Tracking</h1>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
              On the way
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">Arriving in approx. 15 mins</p>
        </div>

        <div className="mb-8 rounded-3xl border border-zinc-100 bg-zinc-50 p-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-sm">
              <img
                src={`https://picsum.photos/seed/${technician.id}/200/200`}
                alt={technician.name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900">{technician.name}</h3>
                {technician.verified && <ShieldCheck size={16} className="text-emerald-600" />}
              </div>
              <div className="flex items-center gap-1 text-sm text-zinc-500">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="font-semibold text-zinc-700">{technician.rating}</span>
                <span>• {technician.category}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95">
              <Phone size={18} />
              <span>Call</span>
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50 active:scale-95">
              <MessageSquare size={18} />
              <span>Chat</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Navigation size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Technician Location</p>
              <p className="text-xs text-zinc-500">Moving along Main Street</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Your Destination</p>
              <p className="text-xs text-zinc-500">Home Address</p>
            </div>
          </div>
        </div>

        {/* Demo Simulation Control */}
        <div className="mt-12 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-700">Demo Simulation</h4>
          <p className="mt-1 text-xs text-emerald-600">Simulate the technician's real-time movement on the map.</p>
          <button
            onClick={() => setSimulating(!simulating)}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${
              simulating 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
            }`}
          >
            {simulating ? (
              <>
                <Square size={18} fill="currentColor" />
                <span>Stop Simulation</span>
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                <span>Start Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map View */}
      <div className="relative min-h-[350px] flex-1 bg-zinc-200 p-4 lg:p-8">
        <TrackingMap technician={technician} />
        
        {/* Floating Overlay */}
        <div className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-zinc-900/90 px-6 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span>GPS Signal Active • Real-time Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
