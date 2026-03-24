import { db, collection, doc, setDoc, Timestamp } from '../firebase';

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Riya', 'Aanya', 'Diya', 'Ananya', 'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma', 'Robert', 'Olivia'];
const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Das', 'Bose', 'Gupta', 'Joshi', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const categories = ['electrician', 'plumber', 'ac', 'fridge'];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number, decimals: number) => Number((Math.random() * (max - min) + min).toFixed(decimals));

export const seedDatabase = async (centerLocation: { lat: number, lng: number }) => {
  const technicians = [];

  for (let i = 0; i < 20; i++) {
    const name = `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
    // Generate location within roughly 10-15km radius
    // 1 degree latitude is approx 111km. So 0.1 degree is ~11km.
    const latOffset = getRandomFloat(-0.1, 0.1, 6);
    const lngOffset = getRandomFloat(-0.1, 0.1, 6);
    
    technicians.push({
      name,
      category: getRandomElement(categories),
      basePrice: getRandomNumber(199, 999),
      experience: getRandomNumber(1, 20),
      rating: getRandomFloat(3.5, 5.0, 1),
      totalJobs: getRandomNumber(10, 500),
      online: Math.random() > 0.2, // 80% chance to be online
      isBusy: Math.random() > 0.7, // 30% chance to be busy
      verified: Math.random() > 0.1, // 90% chance to be verified
      location: {
        lat: centerLocation.lat + latOffset,
        lng: centerLocation.lng + lngOffset
      }
    });
  }

  try {
    for (const tech of technicians) {
      const techId = tech.name.toLowerCase().replace(/\s+/g, '-') + '-' + getRandomNumber(1000, 9999);
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
