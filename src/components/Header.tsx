import { auth, signInWithGoogle, logout } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';
import { Wrench, LogIn, LogOut, User, History } from 'lucide-react';

export default function Header() {
  const [user] = useAuthState(auth);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg transition-all duration-500 group-hover:rotate-12 group-hover:bg-emerald-600 group-hover:shadow-emerald-500/20">
            <Wrench size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-zinc-900">FixIt</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Near Me</span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-6">
              <Link
                to="/history"
                className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900"
              >
                <History size={18} className="transition-transform group-hover:-rotate-12" />
                <span className="hidden sm:inline">Bookings</span>
              </Link>
              
              <div className="h-8 w-px bg-zinc-200" />
              
              <div className="flex items-center gap-4">
                <Link to="/profile" className="group flex items-center gap-3 transition-all">
                  <div className="relative">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="h-10 w-10 rounded-2xl border-2 border-white shadow-md ring-1 ring-zinc-200 transition-transform group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200">
                        <User size={20} />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                  </div>
                  <div className="hidden flex-col sm:flex">
                    <span className="text-sm font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">
                      {user.displayName?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-zinc-400">Profile</span>
                  </div>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-400 transition-all hover:bg-red-50 hover:text-red-600"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95"
            >
              <LogIn size={18} className="transition-transform group-hover:translate-x-1" />
              <span>Sign In</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
