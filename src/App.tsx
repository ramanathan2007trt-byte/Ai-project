import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import BookingsHistory from './pages/BookingsHistory';
import Tracking from './pages/Tracking';
import Profile from './pages/Profile';
import NotificationManager from './components/NotificationManager';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNative } from './utils/platform';

export default function App() {
  useEffect(() => {
    if (isNative()) {
      StatusBar.setStyle({ style: Style.Light });
      SplashScreen.hide();
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
        <Header />
        <NotificationManager />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<BookingsHistory />} />
          <Route path="/tracking/:bookingId" element={<Tracking />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}
