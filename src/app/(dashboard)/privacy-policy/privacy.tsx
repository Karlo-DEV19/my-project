import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-background text-foreground">
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <header className="mb-10 md:mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Legal
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
              This Privacy Policy explains how we collect, use, and protect your information
              when you browse and shop with MJ Decor 888.
            </p>
          </header>

          <div className="space-y-8 md:space-y-10 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Introduction
              </h2>
              <p className="text-muted-foreground">
                By accessing or using our website, you agree to the collection and use of
                information in accordance with this Privacy Policy. We are committed to
                handling your data responsibly and transparently so you can shop with
                confidence.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Information We Collect
              </h2>
              <p className="text-muted-foreground mb-3">
                We may collect the following types of information when you interact with our
                website or services:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Contact details</span> such
                  as your name, email address, and phone number.
                </li>
                <li>
                  <span className="font-medium text-foreground">Order information</span>{" "}
                  including shipping address, selected products, and transaction totals.
                </li>
                <li>
                  <span className="font-medium text-foreground">Usage data</span> such as
                  pages visited, time spent on the site, and device/browser information.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                How We Use Your Information
              </h2>
              <p className="text-muted-foreground mb-3">
                We use the information we collect for purposes that enable us to operate and
                improve our services, including:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Processing and fulfilling your orders and service requests.</li>
                <li>Providing order updates, support, and customer service.</li>
                <li>Improving our product offerings, website experience, and marketing.</li>
                <li>
                  Complying with legal obligations and protecting our rights and our
                  customers.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Cookies
              </h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to remember your
                preferences, keep your cart active, and understand how our website is used.
                You can choose to disable cookies in your browser settings, but this may
                affect certain features such as personalized recommendations or saved carts.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Data Protection
              </h2>
              <p className="text-muted-foreground">
                We take reasonable technical and organizational measures to protect your
                personal data against unauthorized access, alteration, disclosure, or
                destruction. While no method of transmission over the internet is 100%
                secure, we continuously review and improve our safeguards to keep your
                information safe.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-base md:text-lg mb-2">
                Contact Information
              </h2>
              <p className="text-muted-foreground mb-2">
                If you have any questions about this Privacy Policy or how your data is
                handled, you can reach us at:
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
