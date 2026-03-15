'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, MapPin, User, ChevronRight, Check, Lock } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const checkoutFormSchema = z.object({
    firstName: z.string().min(2, { message: 'First name is required.' }),
    lastName: z.string().min(2, { message: 'Last name is required.' }),
    email: z.string().email({ message: 'Valid email is required.' }),
    phone: z.string().min(10, { message: 'Valid phone number is required.' }),
    address: z.object({
        street: z.string().min(5, { message: 'Street address is required.' }),
        barangay: z.string().min(2, { message: 'Barangay is required.' }),
        city: z.string().min(2, { message: 'City is required.' }),
        province: z.string().min(2, { message: 'Province is required.' }),
        zipCode: z.string().min(4, { message: 'Zip code is required.' }),
    }),
    paymentMethod: z.enum(['gcash', 'paymaya'], { error: 'Please select a payment method.' }),
    agreeTerms: z.boolean().refine((val) => val === true, {
        message: 'You must agree to the terms and conditions.',
    }),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const CheckoutForm = () => {
    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutFormSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: {
                street: '',
                barangay: '',
                city: '',
                province: '',
                zipCode: '',
            },
            paymentMethod: 'gcash',
            agreeTerms: false,
        },
    });

    const onSubmit = (data: CheckoutFormValues) => {
        console.log('Form submitted:', data);
        toast('Order Submitted', {
            description: 'Your order has been recorded successfully.',
        });
    };

    return (
        <div className="flex flex-col border border-border bg-background">
            <div className="px-6 py-5 border-b border-border bg-accent/10">
                <h2 className="font-serif text-xl tracking-wide text-foreground">Checkout Details</h2>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col divide-y divide-border">
                    {/* Personal Information */}
                    <div className="p-6 flex flex-col gap-5">
                        <div className="flex items-center gap-3 text-foreground mb-1">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background">
                                <User className="w-3.5 h-3.5" strokeWidth={2} />
                            </div>
                            <h3 className="text-sm uppercase tracking-widest font-semibold">Personal Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">First Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Juan" className="h-12 bg-transparent text-sm" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Last Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Dela Cruz" className="h-12 bg-transparent text-sm" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Email Address</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="juan@example.com" className="h-12 bg-transparent text-sm" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0917 123 4567" className="h-12 bg-transparent text-sm" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="p-6 flex flex-col gap-5">
                        <div className="flex items-center gap-3 text-foreground mb-1">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background">
                                <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                            </div>
                            <h3 className="text-sm uppercase tracking-widest font-semibold">Delivery Address</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="address.street"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Street Address, Unit / Blk</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 Main St, Unit 4B" className="h-12 bg-transparent text-sm" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address.barangay"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Barangay</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Brgy. San Lorenzo" className="h-12 bg-transparent text-sm" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address.city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">City / Municipality</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Makati City" className="h-12 bg-transparent text-sm" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address.province"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Province</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Metro Manila" className="h-12 bg-transparent text-sm" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address.zipCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Postal / Zip Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="1223" className="h-12 bg-transparent text-sm" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="p-6 flex flex-col gap-5">
                        <div className="flex items-center gap-3 text-foreground mb-1">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background">
                                <CreditCard className="w-3.5 h-3.5" strokeWidth={2} />
                            </div>
                            <h3 className="text-sm uppercase tracking-widest font-semibold">Payment Method</h3>
                        </div>

                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-2 gap-4"
                                        >
                                            <FormItem className="relative flex flex-col cursor-pointer">
                                                <FormControl>
                                                    <RadioGroupItem value="gcash" className="sr-only peer" />
                                                </FormControl>
                                                <div className="h-16 flex items-center justify-center p-4 border border-border bg-transparent peer-data-[state=checked]:border-foreground peer-data-[state=checked]:bg-foreground/5 transition-all">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-semibold tracking-wide text-foreground">GCash</span>
                                                    </div>
                                                </div>
                                            </FormItem>

                                            <FormItem className="relative flex flex-col cursor-pointer">
                                                <FormControl>
                                                    <RadioGroupItem value="paymaya" className="sr-only peer" />
                                                </FormControl>
                                                <div className="h-16 flex items-center justify-center p-4 border border-border bg-transparent peer-data-[state=checked]:border-foreground peer-data-[state=checked]:bg-foreground/5 transition-all">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-semibold tracking-wide text-foreground">Maya <span className="text-muted-foreground">(PayMaya)</span></span>
                                                    </div>
                                                </div>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="agreeTerms"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-border bg-accent/10 mt-2">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="text-xs text-foreground cursor-pointer">
                                            I agree to the Terms and Conditions
                                        </FormLabel>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                                            By placing this order, you agree to our terms. For custom items like blinds, a downpayment is required to confirm your order details and scheduling.
                                        </p>
                                    </div>
                                    <FormMessage className="text-[10px] block" />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Submit */}
                    <div className="p-6 bg-accent/5">
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 h-14 bg-foreground text-background uppercase tracking-widest text-xs font-semibold hover:bg-foreground/90 transition-all active:scale-[0.99]"
                        >
                            Place Order
                            <ChevronRight className="w-4 h-4" strokeWidth={2} />
                        </button>
                    </div>
                </form>
            </Form>
        </div>
    );
};