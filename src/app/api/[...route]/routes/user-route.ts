import { Hono } from 'hono';
import {
  getAllUsers,
  createUser,
  deleteUser,
  signupUser,
  loginUser,
} from '@/app/api/controller/user-controller';

const userRoute = new Hono();

// ── Admin CRUD ──────────────────────────────────────────────────
userRoute.get('/', getAllUsers);
userRoute.post('/', createUser);
userRoute.delete('/:id', deleteUser);

// ── Customer Auth ───────────────────────────────────────────────
userRoute.post('/signup', signupUser);
userRoute.post('/login', loginUser);

export default userRoute;
