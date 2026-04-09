import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import artisansRouter from './routes/artisans.js';
import quotesRouter from './routes/quotes.js';
import authRouter from './routes/auth.js';
import paymentRouter from './routes/payment.js';
import reviewsRouter from './routes/reviews.js';
import adminRouter from './routes/admin.js';
import analyticsRouter from './routes/analytics.js';
import productsRouter from './routes/products.js';
import messagesRouter from './routes/messages.js';
import notificationsRouter from './routes/notifications.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 5000;

// Helper to create and notify
const createNotification = async (userId, type, content, link) => {
  try {
    const { query } = await import('./db/index.js');
    const { rows } = await query(
      'INSERT INTO notifications (user_id, type, content, link) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, type, content, link]
    );
    io.to(`user_${userId}`).emit('notification', rows[0]);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room`);
  });

  socket.on('sendMessage', async (data) => {
    const { senderId, receiverId, content, quoteId } = data;
    try {
      const { query } = await import('./db/index.js');
      const { rows } = await query(
        'INSERT INTO messages (sender_id, receiver_id, content, quote_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [senderId, receiverId, content, quoteId]
      );
      const message = rows[0];
      io.to(`user_${receiverId}`).emit('message', message);
      io.to(`user_${senderId}`).emit('message', message);
      
      // Notify receiver
      await createNotification(receiverId, 'message', `Nouveau message: ${content.substring(0, 30)}...`, `/messages`);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir les images publiquement

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API BTP Market est en ligne' });
});

app.use('/api/artisans', artisansRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/auth', authRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/products', productsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
