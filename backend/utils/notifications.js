import { query } from '../db/index.js';

export const createNotification = async (io, userId, type, content, link) => {
  try {
    const { rows } = await query(
      'INSERT INTO notifications (user_id, type, content, link) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, type, content, link]
    );
    
    if (io) {
      io.to(`user_${userId}`).emit('notification', rows[0]);
    }
    
    return rows[0];
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};
