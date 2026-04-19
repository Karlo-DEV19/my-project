import { z } from 'zod';

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Full name is required')
      .regex(/^[A-Za-z\s]+$/, 'Name must not contain numbers or special characters')
      .refine((v) => v.trim().split(/\s+/).length >= 2, {
        message: 'Please enter your first and last name',
      }),

    email: z.string().email('Invalid email address'),

    password: z.string().min(6, 'Password must be at least 6 characters'),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;

// Unified form type — all fields present so react-hook-form always
// has a concrete shape regardless of the active mode (login | signup).
export type AccountFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}; 
