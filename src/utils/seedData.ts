import { db, collection, doc, setDoc, Timestamp } from '../firebase';

export const seedDatabase = async () => {
  const technicians = [
    { name: 'Rajesh Kumar', category: 'electrician', basePrice: 299, experience: 8, rating: 4.8, totalJobs: 156, online: true, isBusy: false, verified: true, location: { lat: 19.0760, lng: 72.8777 } },
    { name: 'Amit Singh', category: 'plumber', basePrice: 199, experience: 5, rating: 4.5, totalJobs: 89, online: true, isBusy: true, verified: true, location: { lat: 19.0860, lng: 72.8877 } },
    { name: 'Suresh Raina', category: 'ac', basePrice: 499, experience: 12, rating: 4.9, totalJobs: 320, online: true, isBusy: false, verified: false, location: { lat: 19.0660, lng: 72.8677 } },
    { name: 'Vijay Varma', category: 'fridge', basePrice: 399, experience: 6, rating: 4.2, totalJobs: 45, online: true, isBusy: false, verified: true, location: { lat: 19.0960, lng: 72.8977 } },
    { name: 'Karan Johar', category: 'electrician', basePrice: 349, experience: 4, rating: 4.6, totalJobs: 67, online: true, isBusy: true, verified: false, location: { lat: 19.0560, lng: 72.8577 } },
    { name: 'Priya Sharma', category: 'plumber', basePrice: 249, experience: 7, rating: 4.7, totalJobs: 112, online: true, isBusy: false, verified: true, location: { lat: 19.0460, lng: 72.8477 } },
    { name: 'Anil Kapoor', category: 'ac', basePrice: 549, experience: 15, rating: 5.0, totalJobs: 450, online: true, isBusy: false, verified: true, location: { lat: 19.1060, lng: 72.9077 } },
    { name: 'Deepika Padukone', category: 'fridge', basePrice: 449, experience: 3, rating: 4.4, totalJobs: 32, online: true, isBusy: false, verified: false, location: { lat: 19.1160, lng: 72.9177 } },
    { name: 'Ranveer Singh', category: 'electrician', basePrice: 399, experience: 9, rating: 4.9, totalJobs: 210, online: true, isBusy: false, verified: true, location: { lat: 19.1260, lng: 72.9277 } },
    { name: 'Alia Bhatt', category: 'plumber', basePrice: 299, experience: 4, rating: 4.3, totalJobs: 58, online: true, isBusy: false, verified: true, location: { lat: 19.1360, lng: 72.9377 } },
  ];

  try {
    for (const tech of technicians) {
      const techId = tech.name.toLowerCase().replace(/\s+/g, '-');
      await setDoc(doc(db, 'technicians', techId), {
        ...tech,
        email: `${techId}@example.com`,
        currentLocation: tech.location,
        createdAt: Timestamp.now(),
      });
    }
    return true;
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};
