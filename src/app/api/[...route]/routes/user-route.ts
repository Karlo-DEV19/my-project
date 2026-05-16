import { Hono } from 'hono';
import {
  getAllUsers,
  createUser,
  deleteUser,
  updateUserProfile,
  syncUser,
} from '@/app/api/controller/user-controller';

const userRoute = new Hono();

// ── Admin CRUD ──────────────────────────────────────────────────
userRoute.get('/', getAllUsers);
userRoute.post('/', createUser);
userRoute.delete('/:id', deleteUser);

// ── Customer Profile ────────────────────────────────────────────
userRoute.patch('/profile', updateUserProfile); // Update display name
userRoute.post('/sync', syncUser);              // Upsert after Magic Link login

export default userRoute;
