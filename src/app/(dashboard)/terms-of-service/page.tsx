import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <main className="bg-background text-foreground">
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <header className="mb-10 md:mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Legal
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
              These Terms of Service outline the rules and conditions for using the MJ Decor 888
              website and services.
            </p>
          </header>

          <div className="space-y-8 md:space-y-10 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Acceptance of Terms
              </h2>
              <p className="text-muted-foreground">
                By accessing or using our website, placing an order, or booking our services, you
                agree to be bound by these Terms of Service and any additional policies referenced
                here.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Orders & Payments
              </h2>
              <p className="text-muted-foreground mb-3">
                All orders are subject to availability and confirmation. Prices, promotions, and
                product details may change without prior notice.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Orders are confirmed once payment terms are agreed upon.</li>
                <li>Custom and made-to-measure products may be non-refundable.</li>
                <li>Any outstanding balances must be settled according to agreed terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Use of Our Website
              </h2>
              <p className="text-muted-foreground">
                You agree not to misuse our website, interfere with its security, or attempt to
                access restricted areas without authorization. Content on this site is provided for
                personal, non-commercial use unless otherwise agreed in writing.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Liability
              </h2>
              <p className="text-muted-foreground">
                While we strive to provide accurate information and high-quality products, MJ Decor
                888 is not liable for indirect, incidental, or consequential damages arising from
                the use of our website or services, to the extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Changes to These Terms
              </h2>
              <p className="text-muted-foreground">
                We may update these Terms of Service from time to time. Any changes will be posted
                on this page with an updated effective date. Continued use of our website after
                changes are posted means you accept the updated terms.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Contact Information
              </h2>
              <p className="text-muted-foreground mb-2">
                If you have questions about these terms, you can contact us at:
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

