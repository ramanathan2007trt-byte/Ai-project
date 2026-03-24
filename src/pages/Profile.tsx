import React, { useState, useEffect } from 'react';
import { auth, db, doc, getDoc, setDoc, handleFirestoreError, OperationType, serverTimestamp } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { User, MapPin, Phone, Mail, Save, Loader2, ArrowLeft, Database, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { seedDatabase } from '../utils/seedData';

export default function Profile() {
  const [user, loadingAuth] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [exists, setExists] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
  });

  useEffect(() => {
    if (loadingAuth) return;
    if (!user) {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setExists(true);
          const data = userDoc.data();
          setFormData({
            name: data.name || user.displayName || '',
            phone: data.phone || '',
            address: data.address || '',
            email: data.email || user.email || '',
          });
        } else {
          setExists(false);
          // Initialize with auth data if doc doesn't exist
          setFormData({
            name: user.displayName || '',
            phone: '',
            address: '',
            email: user.email || '',
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, loadingAuth, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const updateData: any = {
        ...formData,
        role: 'user',
        updatedAt: serverTimestamp(),
      };

      if (!exists) {
        updateData.createdAt = serverTimestamp();
      }

      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      
      setExists(true);
      toast.success('Profile updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedDatabase();
      toast.success('Database seeded successfully!');
    } catch (error) {
      toast.error('Failed to seed database');
    } finally {
      setSeeding(false);
    }
  };

  if (loadingAuth || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-4"
      >
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">My Profile</h1>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-1"
        >
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-emerald-50 bg-zinc-100 shadow-inner">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={formData.name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                  <User size={40} />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-zinc-900">{formData.name}</h2>
            <p className="text-sm text-zinc-500">{formData.email}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2"
        >
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-semibold text-zinc-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-zinc-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-semibold text-zinc-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    id="email"
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 pl-10 pr-4 text-zinc-500"
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-400">Email cannot be changed</p>
              </div>

              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-zinc-700">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-zinc-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="mb-1 block text-sm font-semibold text-zinc-700">
                  Physical Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-zinc-400" size={18} />
                  <textarea
                    id="address"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-zinc-900 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Enter your full address"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white transition-all hover:bg-emerald-700 hover:shadow-lg disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </form>

          {/* Admin Section */}
          {user?.email === 'ramanathan2007trt@gmail.com' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 space-y-4 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8"
            >
              <div className="flex items-center gap-3 text-emerald-700">
                <Database size={24} />
                <h3 className="text-xl font-bold">Admin Controls</h3>
              </div>
              <p className="text-sm text-emerald-600">
                Populate the database with mock technicians and service data for testing.
              </p>
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white transition-all hover:bg-emerald-700 hover:shadow-lg disabled:opacity-50 active:scale-[0.98]"
              >
                {seeding ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Seed Mock Data</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
