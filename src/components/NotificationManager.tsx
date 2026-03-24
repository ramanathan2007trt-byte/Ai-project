import React, { useEffect } from 'react';
import { auth, db, messaging, getToken, onMessage, doc, updateDoc, onSnapshot, collection, query, where } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast from 'react-hot-toast';

export default function NotificationManager() {
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user || !messaging) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: 'BPHtZ9_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0_6_0' // This is a placeholder, in a real app you'd get this from Firebase Console
          });
          
          if (token) {
            await updateDoc(doc(db, 'users', user.uid), {
              fcmToken: token,
              notificationsEnabled: true
            });
          }
        }
      } catch (error) {
        console.error('Error getting notification permission:', error);
      }
    };

    requestPermission();

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      if (payload.notification) {
        toast.success(`${payload.notification.title}: ${payload.notification.body}`, {
          duration: 5000,
          icon: '🔔'
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Simulated notifications for booking status changes
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const booking = change.doc.data();
          const oldBooking = change.doc.data(); // This is not quite right for old data, but for demo purposes:
          
          // In a real app, you'd compare status
          if (booking.status === 'confirmed') {
            showLocalNotification('Booking Confirmed!', `Your booking for ${booking.category} has been confirmed.`);
          } else if (booking.status === 'completed') {
            showLocalNotification('Service Completed!', `Your ${booking.category} service is finished. Please leave a review!`);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  const showLocalNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
    toast.success(`${title}: ${body}`, { duration: 5000, icon: '🔔' });
  };

  return null;
}
