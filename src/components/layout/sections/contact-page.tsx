'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

// Philippine mobile: 09XXXXXXXXX (11) or +639XXXXXXXXX (12) or 9XXXXXXXXX (10)
const phMobileRegex = /^(09\d{9}|639\d{9}|9\d{9})$/;

const contactSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    phoneNumber: z
        .string()
        .min(1, 'Phone number is required')
        .refine(
            (val) => phMobileRegex.test(val.replace(/\D/g, '')),
            'Enter a valid Philippine mobile (e.g. +63 9XX XXX XXXX or 09XX XXX XXXX)'
        ),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    location: z.string().min(1, 'Location / project area is required'),
    message: z.string().min(10, 'Please provide more details (at least 10 characters)'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

// Format as +63 9XX XXX XXXX (GCash-style)
export function formatPhilippinePhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    let m = digits;
    if (m.startsWith('63')) m = m.slice(2);
    else if (m.startsWith('0')) m = m.slice(1);
    m = m.slice(0, 10);
    if (m.length === 0) return '';
    const parts = ['+63', m.slice(0, 1)];
    if (m.length > 1) parts.push(m.slice(1, 3));
    if (m.length > 3) parts.push(m.slice(3, 6));
    if (m.length > 6) parts.push(m.slice(6));
    return parts.join(' ');
}

const ContactPage = () => {
    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            fullName: '',
            phoneNumber: '',
            email: '',
            location: '',
            message: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = (data: ContactFormValues) => {
        // TODO: send to API or email service
        console.log('Contact form submitted:', data);
    };

    return (
        <section className="w-full bg-background text-foreground py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                {/* Header */}
                <div className="mb-10 md:mb-14 text-center">
                    <p className="text-xs md:text-sm tracking-[0.25em] uppercase text-muted-foreground mb-3">
                        Get in touch
                    </p>
                    <h1 className="text-3xl md:text-4xl font-serif tracking-wide mb-3">
                        Let&apos;s talk about your windows.
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Send us your questions, preferred blinds, or measurements if you have them. We&apos;ll respond
                        with options, pricing guidance, and the best schedule for on-site measurement.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1.1fr,0.9fr] gap-10 md:gap-12 items-start">
                    {/* Form */}
                    <div className="bg-muted/40 border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
                                                    Full Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Juan Dela Cruz"
                                                        className="rounded-none border-border bg-background/60"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
                                                    Phone Number
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="+63 9XX XXX XXXX"
                                                        className="rounded-none border-border bg-background/60"
                                                        {...field}
                                                        onChange={(e) => {
                                                            const formatted = formatPhilippinePhone(e.target.value);
                                                            field.onChange(formatted);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
                                                Email Address
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    className="rounded-none border-border bg-background/60"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
                                                Location / Project Area
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Home or condo in Cubao, Quezon City"
                                                    className="rounded-none border-border bg-background/60"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
                                                How can we help?
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Tell us about your space, preferred blinds, window sizes, or any questions you have."
                                                    className="min-h-[140px] resize-none rounded-none border-border bg-background/60"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={form.formState.isSubmitting}
                                        className="w-full sm:w-auto rounded-none bg-foreground text-background hover:bg-foreground/90 px-10 tracking-[0.18em] text-xs font-bold uppercase"
                                    >
                                        {form.formState.isSubmitting ? 'Sending...' : 'Send Message'}
                                    </Button>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        We&apos;ll only use your details to coordinate quotations, measurements, and
                                        installation schedules.
                                    </p>
                                </div>
                            </form>
                        </Form>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-8 md:space-y-10">
                        <div className="space-y-3">
                            <h2 className="text-lg md:text-xl font-semibold tracking-wide">
                                Visit us or book a measurement.
                            </h2>
                            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                We serve homes, condos, and offices within Metro Manila and nearby areas. Share your
                                project details and we&apos;ll recommend the most suitable blinds for your space.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                    <MapPin className="w-4 h-4 text-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">
                                        Location
                                    </p>
                                    <p className="text-sm md:text-base">
                                        35 20th Avenue, Murphy Cubao,
                                        <br />
                                        Quezon City, Philippines, 1109
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                    <Phone className="w-4 h-4 text-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">
                                        Mobile / Viber
                                    </p>
                                    <p className="text-sm md:text-base text-foreground">0912345678</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        You can also send window photos here for faster estimates.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                    <Mail className="w-4 h-4 text-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">
                                        Email
                                    </p>
                                    <a
                                        href="mailto:mjdecor1888@gmail.com"
                                        className="text-sm md:text-base text-foreground hover:underline"
                                    >
                                        mjdecor1888@gmail.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactPage;
