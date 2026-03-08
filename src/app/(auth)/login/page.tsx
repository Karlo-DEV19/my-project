'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, ArrowRight, ShieldAlert, KeyRound, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { signIn, verifyAdminPasscode } from '../../../../actions/auth';
// Make sure this path is correct for your project structure

const gatekeeperSchema = z.object({
    passcode: z.string().min(1, 'Passcode is required'),
});

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type GatekeeperFormValues = z.infer<typeof gatekeeperSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

// ----------------------------------------------------------------------------
// GATEKEEPER SCREEN
// ----------------------------------------------------------------------------
const GatekeeperScreen = ({ onSuccess }: { onSuccess: () => void }) => {
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<GatekeeperFormValues>({
        resolver: zodResolver(gatekeeperSchema),
        defaultValues: { passcode: '' },
    });

    const onSubmit = async (data: GatekeeperFormValues) => {
        setServerError('');
        const result = await verifyAdminPasscode(data.passcode);

        if (result.success) {
            onSuccess();
        } else {
            setServerError(result.error || 'Verification failed');
        }
    };

    return (
        <div className="w-full max-w-[400px] p-8 space-y-8 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/5">
            <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-2xl shadow-inner">
                    <Lock className="w-7 h-7 text-primary" strokeWidth={2.5} />
                </div>
                <div className="space-y-1.5">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Restricted Access
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Enter the master passcode to unlock the staff authentication portal.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                    <div className="relative group">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                            type="password"
                            placeholder="Enter passcode..."
                            className={`pl-10 h-12 bg-background transition-shadow ${errors.passcode || serverError ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                            {...register('passcode')}
                        />
                    </div>
                    {(errors.passcode?.message || serverError) && (
                        <div className="flex items-center gap-2 text-sm font-medium text-destructive mt-1.5 animate-in fade-in slide-in-from-top-1">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{errors.passcode?.message || serverError}</span>
                        </div>
                    )}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-sm font-semibold tracking-wide">
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Verify Access
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
};

// ----------------------------------------------------------------------------
// STAFF LOGIN SCREEN
// ----------------------------------------------------------------------------
const StaffLoginScreen = () => {
    const [authError, setAuthError] = useState('');
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setAuthError('');

        const result = await signIn({
            email: data.email,
            password: data.password
        });

        if (result.success) {
            router.push('/admin');
        } else {
            setAuthError(result.error || 'An unexpected error occurred.');
        }
    };

    return (
        <div className="w-full max-w-[400px] p-8 space-y-8 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/5 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 bg-foreground text-background rounded-xl flex items-center justify-center mb-2 shadow-sm">
                    <span className="font-serif font-bold text-xl tracking-tighter">MJ</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Staff Portal
                </h1>
                <p className="text-sm text-muted-foreground">
                    Sign in to manage your workspace.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@mjdecors.com"
                        className={`h-11 ${errors.email ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                        {...register('email')}
                    />
                    {errors.email && (
                        <p className="text-sm font-medium text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Password</Label>
                        <Link
                            href="/forgot-password"
                            className="text-xs font-semibold text-primary hover:underline transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className={`h-11 ${errors.password ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                        {...register('password')}
                    />
                    {errors.password && (
                        <p className="text-sm font-medium text-destructive">{errors.password.message}</p>
                    )}
                </div>

                {authError && (
                    <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 animate-in fade-in">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>{authError}</span>
                    </div>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-sm font-semibold tracking-wide mt-2">
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <LogIn className="w-4 h-4 mr-2 opacity-80" />
                            Sign In
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
};

// ----------------------------------------------------------------------------
// MAIN EXPORT
// ----------------------------------------------------------------------------
const LoginPage = () => {
    const [isAuthorized, setIsAuthorized] = useState(false);

    return (
        // ✅ THE ALIGNMENT FIX: 
        // flex-col, flex-1, items-center, justify-center guarantees perfect centering
        // Added a subtle bg-muted/20 to give contrast to the white card
        <div className="flex flex-col flex-1 items-center justify-center w-full p-4 py-12 bg-muted/20">
            {!isAuthorized ? (
                <GatekeeperScreen onSuccess={() => setIsAuthorized(true)} />
            ) : (
                <StaffLoginScreen />
            )}
        </div>
    );
};

export default LoginPage;