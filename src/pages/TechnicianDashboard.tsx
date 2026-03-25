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
  ChevronRight,
  TrendingUp,
  Star,
  IndianRupee,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export default function TechnicianDashboard() {
  const [user] = useAuthState(auth);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

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
  ];  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-mono bg-zinc-950 min-h-screen text-zinc-400">
      {/* Header Section */}
      <div className="mb-12 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
            Control <span className="text-zinc-700">Center</span>
          </h1>
          <div className="mt-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            <span>Operator: {technician.name}</span>
            <span className="h-1 w-1 rounded-full bg-zinc-800" />
            <span>Sector: {technician.category}</span>
            <span className="h-1 w-1 rounded-full bg-zinc-800" />
            <span>Node: {user?.uid.slice(0, 8)}</span>
          </div>
        </div>
        
        <button
          onClick={toggleOnlineStatus}
          className={`group flex items-center gap-3 rounded-none border-2 px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${
            technician.online 
              ? 'bg-emerald-500 text-zinc-950 border-emerald-500 hover:bg-emerald-400' 
              : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
          }`}
        >
          {technician.online ? <Power size={16} /> : <PowerOff size={16} />}
          <span>{technician.online ? 'Go Offline' : 'Go Online'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-3 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-3 border-2 border-zinc-800 bg-zinc-800">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-zinc-900 p-8 border-r-2 border-zinc-800 last:border-r-0">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</span>
                    <stat.icon size={14} className="text-zinc-700" />
                  </div>
                  <p className="text-5xl font-black text-white tracking-tighter">{stat.value}</p>
                  <div className="h-1 w-full bg-zinc-800">
                    <div className={`h-full bg-emerald-500 transition-all duration-1000 ${technician.online ? 'w-2/3' : 'w-0'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div className="divide-y-2 divide-zinc-800 border-2 border-zinc-800 bg-zinc-900">
            <div className="border-b-2 border-zinc-800 bg-zinc-950 px-8 py-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Active Assignments</h2>
            </div>
            {myBookings.length > 0 ? (
              myBookings.map((booking) => (
                <div key={booking.id} className="p-8 transition-all hover:bg-zinc-800/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-12">
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-2 ${
                          booking.status === 'completed' ? 'bg-zinc-800 text-zinc-400 border-zinc-800' :
                          booking.status === 'confirmed' ? 'bg-emerald-500 text-zinc-950 border-emerald-500' :
                          'bg-transparent text-zinc-600 border-zinc-800'
                        }`}>
                          {booking.status}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                          REF: {booking.id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-12">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Date</p>
                          <p className="text-xs font-bold text-zinc-300 uppercase">{booking.date}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Time</p>
                          <p className="text-xs font-bold text-zinc-300 uppercase">{booking.time}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Contact</p>
                          <p className="text-xs font-bold text-zinc-300 uppercase">{booking.phone}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Address</p>
                          <p className="text-xs font-bold text-zinc-300 uppercase truncate">{booking.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right border-l-2 border-zinc-800 sm:pl-12">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Net Earnings</p>
                      <p className="text-5xl font-black text-white tracking-tighter">₹{booking.technicianEarnings || 0}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-80 flex-col items-center justify-center p-8 text-center bg-zinc-950">
                <div className="mb-6 text-zinc-800">
                  <ClipboardList size={64} strokeWidth={1} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">No Assignments</h3>
                <p className="mt-4 text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Awaiting mission acceptance</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* System Log */}
          <div className="border-2 border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-6 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              System Log
            </h3>
            <div className="space-y-4 font-mono text-[9px] uppercase tracking-tighter">
              <div className="flex gap-3 text-zinc-600">
                <span className="text-emerald-500/50">[10:31:25]</span>
                <span>System Initialization Complete</span>
              </div>
              <div className="flex gap-3 text-zinc-600">
                <span className="text-emerald-500/50">[10:31:26]</span>
                <span>Secure Connection Established</span>
              </div>
              <div className="flex gap-3 text-zinc-600">
                <span className="text-emerald-500/50">[10:31:27]</span>
                <span>Node Sync: {user?.uid.slice(0, 8)}</span>
              </div>
              {technician.online && (
                <div className="flex gap-3 text-emerald-500">
                  <span className="opacity-50">[10:31:28]</span>
                  <span className="animate-pulse">Broadcasting Availability...</span>
                </div>
              )}
            </div>
          </div>

          {/* Performance Chart Placeholder */}
          <div className="border-2 border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-6">Performance</h3>
            <div className="flex items-end gap-1 h-32">
              {[40, 70, 45, 90, 65, 80, 55, 75, 85, 60].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-zinc-800 transition-all duration-1000"
                  style={{ height: technician.online ? `${h}%` : '10%' }}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:59</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-2 border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <button className="w-full border border-zinc-800 p-3 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-800 hover:text-white transition-all">
                Update Profile
              </button>
              <button className="w-full border border-zinc-800 p-3 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-800 hover:text-white transition-all">
                View Earnings Report
              </button>
              <button className="w-full border border-zinc-800 p-3 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-800 hover:text-white transition-all">
                Support Protocol
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


