import { X, Calendar, Clock, MapPin, CheckCircle2, Loader2, Info, GripHorizontal, Navigation, CreditCard, Wallet, Banknote } from 'lucide-react';
import { Technician } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';
import { auth, db, addDoc, collection, Timestamp, handleFirestoreError, OperationType, query, where, getDocs, getDoc, doc } from '../firebase';
import { detectFakeCustomer } from '../services/aiService';
import toast from 'react-hot-toast';

interface BookingModalProps {
  technician: Technician | null;
  onClose: () => void;
  onSuccess: () => void;
  userLocation?: { lat: number; lng: number };
  distance?: number;
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const DISTANCE_RATE = 15; // ₹15 per km

export default function BookingModal({ technician, onClose, onSuccess, userLocation, distance }: BookingModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Debit Card' | 'Cash on Delivery'>('Cash on Delivery');
  const [step, setStep] = useState<'details' | 'payment' | 'confirm' | 'success'>('details');

  const estimatedTotal = useMemo(() => {
    if (!technician) return 0;
    const travelFee = (distance || 0) * DISTANCE_RATE;
    return Math.round(technician.basePrice + travelFee);
  }, [technician, distance]);

  const estimatedTravelTime = useMemo(() => {
    if (!distance) return 0;
    // Assume 20km/h average speed in city traffic
    const travelTimeMinutes = Math.round((distance / 20) * 60);
    return travelTimeMinutes + 10; // 10 mins buffer for preparation/traffic
  }, [distance]);

  const isToday = useMemo(() => {
    if (!date) return false;
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  }, [date]);

  useEffect(() => {
    if (date && technician) {
      fetchAvailability();
    }
  }, [date, technician]);

  const fetchAvailability = async () => {
    if (!date || !technician) return;
    setCheckingAvailability(true);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('technicianId', '==', technician.id),
        where('date', '==', date),
        where('status', '!=', 'cancelled')
      );
      const snapshot = await getDocs(q);
      const booked = snapshot.docs.map(doc => doc.data().time);
      setBookedSlots(booked);
      // Reset time if it's now booked
      if (booked.includes(time)) {
        setTime('');
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  if (!technician) return null;

  const handleBooking = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    
    // Simulate payment processing for card payments
    if (paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') {
      setPaymentProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s simulation
      setPaymentProcessing(false);
    }

    try {
      // Fetch user profile for more details
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      // ML Fake Detection
      const fakeCheck = await detectFakeCustomer({
        userName: userData.name || auth.currentUser.displayName || 'Unknown',
        userEmail: userData.email || auth.currentUser.email || 'Unknown',
        userPhone: userData.phone,
        address: userData.address,
        category: technician.category,
        date,
        time,
        distance: distance || 0,
      });

      if (fakeCheck.isFake) {
        toast.error(`Booking flagged as suspicious: ${fakeCheck.reason}`);
      }

      const bookingData = {
        userId: auth.currentUser.uid,
        technicianId: technician.id,
        category: technician.category,
        date,
        time,
        status: 'pending',
        price: estimatedTotal,
        distance: distance || 0,
        paymentStatus: (paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') ? 'paid' : 'pending',
        paymentMethod,
        isFake: fakeCheck.isFake,
        fakeReason: fakeCheck.reason,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
        />
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.05}
          whileDrag={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 cursor-grab active:cursor-grabbing bg-zinc-50/50 select-none">
            <div className="flex items-center gap-2">
              <GripHorizontal size={16} className="text-zinc-400" />
              <h2 className="text-xl font-bold text-zinc-900 pointer-events-none">
                {step === 'success' ? 'Booking Confirmed!' : `Book ${technician.name}`}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {step === 'details' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-2xl bg-emerald-50 p-4">
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-white shadow-sm">
                    <img
                      src={`https://picsum.photos/seed/${technician.id}/100/100`}
                      alt={technician.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-800">{technician.category.toUpperCase()}</p>
                    <p className="text-xs text-emerald-600">Base Price: ₹{technician.basePrice}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">1. Choose Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>
                  </div>

                  {date && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-zinc-700">2. Available Slots</label>
                        {checkingAvailability && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {TIME_SLOTS.map((slot) => {
                          const isBooked = bookedSlots.includes(slot);
                          return (
                            <button
                              key={slot}
                              disabled={isBooked || checkingAvailability}
                              onClick={() => setTime(slot)}
                              className={`rounded-lg py-2 text-xs font-medium transition-all ${
                                time === slot
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                                  : isBooked
                                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                  : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                      {bookedSlots.length > 0 && !checkingAvailability && (
                        <p className="text-[10px] text-zinc-400">Some slots are already booked for this day.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="mt-0.5 text-zinc-400 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-zinc-700">Estimated Total: ₹{estimatedTotal}</p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Includes base price (₹{technician.basePrice}) + travel fee (₹{Math.round((distance || 0) * DISTANCE_RATE)} for {distance?.toFixed(1)} km). Final price may vary based on actual work.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  disabled={!date || !time || checkingAvailability}
                  onClick={() => setStep('payment')}
                  className="w-full rounded-2xl bg-zinc-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900 active:scale-[0.98]"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-zinc-700">Select Payment Method</label>
                  <div className="space-y-3">
                    {[
                      { id: 'Credit Card', icon: CreditCard, label: 'Credit Card' },
                      { id: 'Debit Card', icon: Wallet, label: 'Debit Card' },
                      { id: 'Cash on Delivery', icon: Banknote, label: 'Cash on Delivery' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`flex w-full items-center gap-4 rounded-2xl border p-4 transition-all ${
                          paymentMethod === method.id
                            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                            : 'border-zinc-100 bg-white hover:border-zinc-200'
                        }`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          paymentMethod === method.id ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400'
                        }`}>
                          <method.icon size={20} />
                        </div>
                        <span className={`font-bold ${paymentMethod === method.id ? 'text-emerald-900' : 'text-zinc-600'}`}>
                          {method.label}
                        </span>
                        {paymentMethod === method.id && (
                          <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <CheckCircle2 size={14} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('details')}
                    className="flex-1 rounded-2xl border border-zinc-200 py-3.5 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50 active:scale-[0.98]"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('confirm')}
                    className="flex-[2] rounded-2xl bg-zinc-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
                  >
                    Continue to Confirmation
                  </button>
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Service</span>
                    <span className="font-semibold text-zinc-900 capitalize">{technician.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Professional</span>
                    <span className="font-semibold text-zinc-900">{technician.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Date & Time</span>
                    <span className="font-semibold text-zinc-900">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {time}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Distance</span>
                    <span className="font-semibold text-zinc-900">{distance?.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Payment Method</span>
                    <span className="font-semibold text-zinc-900">{paymentMethod}</span>
                  </div>
                  {isToday && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Est. Arrival Time</span>
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
                        <Navigation size={14} className="rotate-45" />
                        <span>~{estimatedTravelTime} mins</span>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-zinc-200 pt-4 flex justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-zinc-900">Total Amount</span>
                      <p className="text-[10px] text-zinc-400">Incl. base price & travel fee</p>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">₹{estimatedTotal}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('payment')}
                    className="flex-1 rounded-2xl border border-zinc-200 py-3.5 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50 active:scale-[0.98]"
                  >
                    Back
                  </button>
                  <button
                    disabled={loading}
                    onClick={handleBooking}
                    className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Processing Payment...</span>
                      </>
                    ) : loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900">Awesome!</h3>
                  <p className="mt-2 text-zinc-500">Your booking request has been sent to {technician.name}.</p>
                  {isToday && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                      <Clock size={16} />
                      <span>Estimated arrival in {estimatedTravelTime} mins</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
