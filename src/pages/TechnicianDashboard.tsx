import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, auth, handleFirestoreError, OperationType, updateDoc, doc, serverTimestamp } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Booking, Technician } from '../types';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Power, 
  PowerOff,
  Loader2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Star,
  IndianRupee,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function TechnicianDashboard() {
  const [user] = useAuthState(auth);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [availableRequests, setAvailableRequests] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-jobs'>('available');

  useEffect(() => {
    if (!user) return;

    // Fetch technician profile
    const techRef = doc(db, 'technicians', user.uid);
    const unsubscribeTech = onSnapshot(techRef, (doc) => {
      if (doc.exists()) {
        setTechnician({ id: doc.id, ...doc.data() } as Technician);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `technicians/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribeTech();
  }, [user]);

  useEffect(() => {
    if (!user || !technician) return;

    // Fetch available requests (pending and matching category)
    const availableQuery = query(
      collection(db, 'bookings'),
      where('status', '==', 'pending'),
      where('category', '==', technician.category)
    );

    const unsubscribeAvailable = onSnapshot(availableQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setAvailableRequests(requests);
    });

    // Fetch my bookings
    const myBookingsQuery = query(
      collection(db, 'bookings'),
      where('technicianId', '==', user.uid)
    );

    const unsubscribeMy = onSnapshot(myBookingsQuery, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setMyBookings(bookings.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeMy();
    };
  }, [user, technician]);

  const toggleOnlineStatus = async () => {
    if (!user || !technician) return;
    try {
      await updateDoc(doc(db, 'technicians', user.uid), {
        online: !technician.online
      });
      toast.success(`You are now ${!technician.online ? 'Online' : 'Offline'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const acceptRequest = async (bookingId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'confirmed',
        technicianId: user.uid,
        acceptedAt: serverTimestamp()
      });
      toast.success('Request accepted! Go to My Jobs to manage it.');
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
          <User size={40} />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900">Technician Profile Not Found</h2>
        <p className="mt-2 text-zinc-500">Please complete your technician registration to access this dashboard.</p>
      </div>
    );
  }

  const stats = [
    { label: 'Total Jobs', value: technician.totalJobs || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Rating', value: technician.rating || 'N/A', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Earnings', value: `₹${myBookings.reduce((acc, b) => acc + (b.technicianEarnings || 0), 0)}`, icon: IndianRupee, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Technician Dashboard</h1>
          <p className="mt-1 text-sm font-medium text-zinc-500">Welcome back, {technician.name}</p>
        </div>
        
        <button
          onClick={toggleOnlineStatus}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-300 shadow-sm ${
            technician.online 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
              : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200'
          }`}
        >
          {technician.online ? <Power size={18} /> : <PowerOff size={18} />}
          <span>{technician.online ? 'Online & Available' : 'Currently Offline'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-500">{stat.label}</p>
                <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-8 flex items-center gap-1 rounded-xl bg-zinc-100 p-1 border border-zinc-200 w-fit">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'available' 
              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' 
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <LayoutDashboard size={18} />
          <span>Available Requests</span>
          {availableRequests.length > 0 && (
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              {availableRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('my-jobs')}
          className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'my-jobs' 
              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' 
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ClipboardList size={18} />
          <span>My Jobs</span>
        </button>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'available' ? (
          <motion.div
            key="available"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {availableRequests.length > 0 ? (
              availableRequests.map((request) => (
                <div key={request.id} className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">New Request for {request.category}</p>
                          <p className="text-xs font-medium text-zinc-500">Posted {request.createdAt?.toDate().toLocaleTimeString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <Calendar size={16} className="text-zinc-400" />
                          <span className="font-medium">{request.date} at {request.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <MapPin size={16} className="text-zinc-400" />
                          <span className="font-medium truncate max-w-[200px]">{request.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                          <IndianRupee size={16} />
                          <span>₹{request.price}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => acceptRequest(request.id)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 shadow-sm"
                    >
                      <span>Accept Job</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 border border-zinc-200">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-base font-bold text-zinc-900">No available requests</h3>
                <p className="mt-1 text-sm font-medium text-zinc-500">Check back later or try changing your status to online.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="my-jobs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {myBookings.length > 0 ? (
              myBookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-lg border px-3 py-1 text-xs font-bold capitalize ${
                          booking.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          booking.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}>
                          {booking.status}
                        </span>
                        <span className="text-xs font-medium text-zinc-500">
                          ID: {booking.id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <Calendar size={16} className="text-zinc-400" />
                          <span className="font-medium">{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <Clock size={16} className="text-zinc-400" />
                          <span className="font-medium">{booking.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <MapPin size={16} className="text-zinc-400" />
                          <span className="font-medium truncate max-w-[200px]">{booking.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <Phone size={16} className="text-zinc-400" />
                          <span className="font-medium">{booking.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Your Earnings</p>
                      <p className="text-2xl font-black text-zinc-900">₹{booking.technicianEarnings || 0}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 border border-zinc-200">
                  <ClipboardList size={24} />
                </div>
                <h3 className="text-base font-bold text-zinc-900">No jobs yet</h3>
                <p className="mt-1 text-sm font-medium text-zinc-500">Accept available requests to see them here.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


