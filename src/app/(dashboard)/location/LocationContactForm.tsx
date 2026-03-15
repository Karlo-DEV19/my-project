"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const COMPANY_EMAIL = "mjdecor888@gmail.com";
const WORKING_HOURS = "Mon – Sat: 9:00 AM – 6:00 PM";

const locationContactSchema = z.object({
  name: z.string().min(1, "Name is required").min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Subject is required").min(2, "Please describe how we can help"),
  message: z.string().min(1, "Message is required").min(10, "Message must be at least 10 characters"),
});

type LocationContactFormValues = z.infer<typeof locationContactSchema>;

const defaultValues: LocationContactFormValues = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function LocationContactForm() {
  const [sent, setSent] = useState(false);

  const form = useForm<LocationContactFormValues>({
    resolver: zodResolver(locationContactSchema),
    defaultValues,
    mode: "onBlur",
  });

  const onSubmit = async (data: LocationContactFormValues) => {
    // Replace with your API / email service later
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    form.reset(defaultValues);
  };

  return (
    <div className="space-y-8">
      {/* Company info */}
      <div className="rounded-xl border border-border/80 bg-muted/30 p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          MJ Decor 888
        </h3>
        <p className="text-sm text-foreground">
          <span className="text-muted-foreground">Email:</span>{" "}
          <a
            href={`mailto:${COMPANY_EMAIL}`}
            className="text-foreground underline-offset-2 hover:underline"
          >
            {COMPANY_EMAIL}
          </a>
        </p>
        <p className="mt-1 text-sm text-foreground">
          <span className="text-muted-foreground">Working hours:</span>{" "}
          {WORKING_HOURS}
        </p>
      </div>

      {/* Contact form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your name"
                      className="h-11 rounded-none border-border"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="h-11 rounded-none border-border"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Phone
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="09XX XXX XXXX"
                      className="h-11 rounded-none border-border"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Subject (How can we help?)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Quote, Installation, Support"
                      className="h-11 rounded-none border-border"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Message
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Your message..."
                    rows={5}
                    className="resize-none rounded-none border-border"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-12 w-full rounded-none bg-foreground px-6 text-xs font-semibold uppercase tracking-[0.2em] text-background hover:bg-foreground/90 disabled:opacity-70 sm:w-auto"
          >
            {form.formState.isSubmitting
              ? "Sending…"
              : sent
                ? "Message sent"
                : "Send message"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
