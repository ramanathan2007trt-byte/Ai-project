import express from 'express';
import { createServer as createViteServer } from 'vite';
import Razorpay from 'razorpay';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/create-razorpay-order', async (req, res) => {
    try {
      const { amount } = req.body; // Amount in INR rupees

      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ error: 'Razorpay keys are not configured in the environment' });
      }

      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`
      };

      const order = await instance.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // In express v4, we can use * and sendFile
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
