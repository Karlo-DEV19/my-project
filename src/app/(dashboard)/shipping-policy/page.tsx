import Link from "next/link";

export default function ShippingPolicyPage() {
  return (
    <main className="bg-background text-foreground">
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <header className="mb-10 md:mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Legal
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-tight">
              Shipping Policy
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
              This Shipping Policy explains how we handle deliveries, lead times, and service areas
              for orders placed with MJ Decor 888.
            </p>
          </header>

          <div className="space-y-8 md:space-y-10 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Delivery Coverage
              </h2>
              <p className="text-muted-foreground">
                We primarily serve Metro Manila and nearby provinces. For locations outside our
                standard service area, additional lead time or fees may apply and will be
                communicated before confirming your order.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Lead Time & Scheduling
              </h2>
              <p className="text-muted-foreground mb-3">
                Production and installation timelines depend on the type and quantity of blinds or
                window treatments ordered. Our team will provide an estimated schedule upon
                confirmation of your order.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Standard orders usually take several business days to process.</li>
                <li>Custom or bulk orders may require additional time.</li>
                <li>Installation dates are coordinated with you in advance.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Shipping & Installation Fees
              </h2>
              <p className="text-muted-foreground">
                Delivery and installation fees may vary based on location, order size, and
                complexity. Any applicable fees will be clearly communicated before you finalize
                your purchase.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Changes & Cancellations
              </h2>
              <p className="text-muted-foreground">
                If you need to reschedule or update your delivery or installation details, please
                contact us as early as possible. Changes may affect your delivery timeline and may
                be subject to our order policies.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Contact Information
              </h2>
              <p className="text-muted-foreground mb-2">
                For questions or clarifications about this Shipping Policy, you can reach us at:
              </p>
              <p className="text-muted-foreground">
                Email: <span className="text-foreground">mjdecor888@gmail.com</span>
                <br />
                Phone: <span className="text-foreground">0917 694 8888</span>
              </p>
            </section>
          </div>

          <div className="mt-12">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

