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
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm">
            <Wrench size={16} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold tracking-tight text-zinc-900">FixIt</span>
            <span className="text-xs font-semibold tracking-wide text-emerald-600">Pro</span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-6">
              <Link
                to="/history"
                className="flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
              >
                <History size={16} />
                <span className="hidden sm:inline">Bookings</span>
              </Link>
              
              <div className="h-4 w-px bg-zinc-200" />
              
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="h-8 w-8 rounded-lg border border-zinc-200 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200">
                      <User size={14} />
                    </div>
                  )}
                  <span className="hidden text-sm font-medium text-zinc-700 sm:block">
                    {user.displayName?.split(' ')[0]}
                  </span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800 active:scale-95 shadow-sm"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
