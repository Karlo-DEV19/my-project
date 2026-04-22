'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, ShoppingBag } from 'lucide-react';
import {
  loginSchema,
  signupSchema,
  type AccountFormData,
} from '@/lib/validations/account.schema';
import { TwoFactorModal } from '@/components/auth/otp-code-dialog';

// ─── Props ───────────────────────────────────────────────────────────────────

type AccountFormProps = {
  mode?: 'login' | 'signup';
  onModeChange?: (mode: 'login' | 'signup') => void;
  onClose?: () => void;
  /** Called with true when OTP modal opens, false when it closes/cancels.
   *  AccountModal uses this to suppress its backdrop click-to-close. */
  onOtpStateChange?: (active: boolean) => void;
  /** Forwarded by AccountModal — 'checkout' shows a guided message */
  context?: 'default' | 'checkout';
};

// ─── Input helper ────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    'w-full bg-transparent border rounded-md px-3 py-2 text-sm text-foreground',
    'placeholder:text-muted-foreground/50',
    'focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
    hasError
      ? 'border-destructive focus:ring-destructive/40'
      : 'border-border focus:border-foreground',
  ].join(' ');
}

// ─── PasswordInput ───────────────────────────────────────────────────────────

function PasswordInput({
  id,
  placeholder,
  hasError,
  describedBy,
  registration,
}: {
  id: string;
  placeholder: string;
  hasError: boolean;
  describedBy?: string;
  registration: ReturnType<ReturnType<typeof useForm<AccountFormData>>['register']>;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        {...registration}
        className={`${inputCls(hasError)} pr-10`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ─── Main Form ───────────────────────────────────────────────────────────────

export default function AccountForm({
  mode = 'login',
  onModeChange,
  onClose,
  onOtpStateChange,
  context = 'default',
}: AccountFormProps) {
  const uid = useId();
  const ids = {
    name: `${uid}-name`,
    nameErr: `${uid}-name-err`,
    email: `${uid}-email`,
    emailErr: `${uid}-email-err`,
    password: `${uid}-password`,
    passwordErr: `${uid}-password-err`,
    confirmPassword: `${uid}-confirmPassword`,
    confirmPasswordErr: `${uid}-confirmPassword-err`,
  };

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // otpEmail is set to the verified address when the server returns OTP_REQUIRED,
  // which opens TwoFactorModal. Cleared on cancel or after successful verification.
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  // Use the schema that matches the current mode. Both schemas are cast to
  // `unknown` first to satisfy the resolver overload — safe because we
  // manually control which fields render and therefore which fields are validated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeSchema = mode === 'login' ? loginSchema : signupSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<AccountFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(activeSchema as any),
    mode: 'onChange',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  // Reset + clear messages on mode switch
  useEffect(() => {
    reset({ name: '', email: '', password: '', confirmPassword: '' });
    setSuccessMessage(null);
    setServerError(null);
  }, [mode, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus email on mount / mode change
  useEffect(() => {
    const t = setTimeout(() => emailRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [mode]);

  const handleModeSwitch = (next: 'login' | 'signup') => {
    reset({ name: '', email: '', password: '', confirmPassword: '' });
    setSuccessMessage(null);
    setServerError(null);
    onModeChange?.(next);
  };

  const onSubmit: SubmitHandler<AccountFormData> = async (data) => {
    setServerError(null);
    setSuccessMessage(null);

    const email = data.email.trim().toLowerCase();
    const endpoint = mode === 'signup' ? '/api/v1/users/signup' : '/api/v1/users/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'signup'
            ? { name: data.name?.trim(), email }
            : { email }
        ),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setServerError(json.message ?? 'Something went wrong. Please try again.');
        return;
      }

      // Server issued an OTP — open the verification modal.
      // User data is NOT returned here; it comes back after /verify-otp.
      if (json.status === 'OTP_REQUIRED') {
        setOtpEmail(json.email as string);
        onOtpStateChange?.(true);  // tell AccountModal to pause backdrop close
        return;
      }

      // Fallback path (should not occur with current backend, kept for safety)
      if (mode === 'login' && json.data) {
        localStorage.setItem('user', JSON.stringify(json.data));
      }
      const msg = mode === 'login' ? 'Welcome back!' : 'Account created successfully!';
      setSuccessMessage(msg);
      setTimeout(() => {
        setSuccessMessage(null);
        reset({ name: '', email: '', password: '', confirmPassword: '' });
        onClose?.();
      }, 1500);
    } catch {
      setServerError('A network error occurred. Please try again.');
    }
  };

  // Called by TwoFactorModal with the 6-digit code.
  // Throws on failure so the modal can display the inline error.
  const handleVerifyOtp = async (code: string) => {
    if (!otpEmail) return;

    const res = await fetch('/api/v1/users/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otpEmail, code }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message ?? 'Invalid or expired verification code.');
    }

    // Persist verified user so account-button.tsx can read it
    if (json.data) {
      localStorage.setItem('user', JSON.stringify(json.data));
    }

    // Tear down OTP modal + form
    setOtpEmail(null);
    onOtpStateChange?.(false);
    reset({ name: '', email: '', password: '', confirmPassword: '' });
    onClose?.();

    // ── Post-login redirect ──────────────────────────────────────────────────
    const redirect = localStorage.getItem('redirectAfterLogin');
    if (redirect) {
      localStorage.removeItem('redirectAfterLogin');
      window.location.href = redirect;   // preserves Zustand cart (not cleared)
    } else {
      window.location.reload();
    }
  };

  // Merge RHF ref with our emailRef
  const emailRegistration = register('email');

  return (
    <>
      {/* ── Checkout context banner ── */}
      {context === 'checkout' && (
        <div className="flex flex-col items-center gap-2 mb-5 px-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            You&apos;re almost there! Please log in or sign up to complete your order.
          </p>
          <div className="w-full h-px bg-border mt-1" />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4" noValidate>

        {/* ── Server error banner ── */}
        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium rounded-md px-4 py-3 animate-in fade-in duration-200"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {serverError}
          </div>
        )}

        {/* ── Success banner ── */}
        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm font-medium rounded-md px-4 py-3 animate-in fade-in duration-300"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* ── Name (signup only) ── */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.name} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Name
            </label>
            <input
              id={ids.name}
              type="text"
              placeholder="John Doe"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? ids.nameErr : undefined}
              {...register('name')}
              className={inputCls(!!errors.name)}
            />
            {errors.name && (
              <span id={ids.nameErr} role="alert" className="text-[10px] text-destructive font-medium">
                {errors.name.message as string}
              </span>
            )}
          </div>
        )}

        {/* ── Email ── */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.email} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Email
          </label>
          <input
            id={ids.email}
            type="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? ids.emailErr : undefined}
            {...emailRegistration}
            ref={(el) => {
              emailRegistration.ref(el);
              emailRef.current = el;
            }}
            className={inputCls(!!errors.email)}
          />
          {errors.email && (
            <span id={ids.emailErr} role="alert" className="text-[10px] text-destructive font-medium">
              {errors.email.message as string}
            </span>
          )}
        </div>

        {/* ── Password ── */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.password} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Password
          </label>
          <PasswordInput
            id={ids.password}
            placeholder="••••••••"
            hasError={!!errors.password}
            describedBy={errors.password ? ids.passwordErr : undefined}
            registration={register('password')}
          />
          {mode === 'login' && (
            <div className="flex justify-center mt-3 mb-1">
              <button
                type="button"
                onClick={() => alert('Password reset coming soon')}
                className="text-xs text-muted-foreground hover:underline transition-all focus:outline-none focus:ring-1 focus:ring-ring rounded-sm"
              >
                Forgot Password?
              </button>
            </div>
          )}
          {errors.password && (
            <span id={ids.passwordErr} role="alert" className="text-[10px] text-destructive font-medium">
              {errors.password.message as string}
            </span>
          )}
        </div>

        {/* ── Confirm Password (signup only) ── */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.confirmPassword} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Confirm Password
            </label>
            <PasswordInput
              id={ids.confirmPassword}
              placeholder="••••••••"
              hasError={!!errors.confirmPassword}
              describedBy={errors.confirmPassword ? ids.confirmPasswordErr : undefined}
              registration={register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <span id={ids.confirmPasswordErr} role="alert" className="text-[10px] text-destructive font-medium">
                {errors.confirmPassword.message as string}
              </span>
            )}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isSubmitting || !!successMessage}
          className="w-full bg-foreground text-background text-sm font-medium py-2 rounded-md hover:opacity-90 transition-opacity mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {isSubmitting && (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {isSubmitting
            ? mode === 'login' ? 'Signing in...' : 'Creating account...'
            : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        {/* ── Mode toggle ── */}
        <p className="text-center text-xs text-muted-foreground mt-1">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('signup')}
                className="text-foreground font-medium underline underline-offset-2 hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className="text-foreground font-medium underline underline-offset-2 hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
              >
                Sign in
              </button>
            </>
          )}
        </p>

      </form>

      {/* ── OTP Modal — mounts only when server returns OTP_REQUIRED ── */}
      <TwoFactorModal
        isOpen={!!otpEmail}
        email={otpEmail ?? ''}
        mode={mode}
        onVerify={handleVerifyOtp}
        onClose={() => {
          setOtpEmail(null);
          onOtpStateChange?.(false); // restore backdrop click-to-close
        }}
      />
    </>
  );
}
