import { Hono } from 'hono';
import {
  getAllUsers,
  createUser,
  deleteUser,
  signupUser,
  loginUser,
  verifyUserOtp,
  updateUserProfile,
} from '@/app/api/controller/user-controller';

const userRoute = new Hono();

// ── Admin CRUD ──────────────────────────────────────────────────
userRoute.get('/', getAllUsers);
userRoute.post('/', createUser);
userRoute.delete('/:id', deleteUser);

// ── Customer Auth ───────────────────────────────────────────────
userRoute.post('/signup', signupUser);        // Step 1 — create account, send OTP
userRoute.post('/login', loginUser);          // Step 1 — verify email exists, send OTP
userRoute.post('/verify-otp', verifyUserOtp); // Step 2 — validate code, return user

// ── Customer Profile ────────────────────────────────────────────
userRoute.patch('/profile', updateUserProfile); // Update display name

export default userRoute;
