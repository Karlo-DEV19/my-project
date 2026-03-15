import Link from "next/link";
import LocationContactForm from "./LocationContactForm";
import LocationMapWrapper from "./LocationMapWrapper";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps?q=35+20th+Avenue+Murphy+Cubao+Quezon+City";

export default function LocationPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <header className="mb-10 text-center md:mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Find Us & Get in Touch
          </p>
          <h1 className="font-serif text-3xl tracking-tight md:text-4xl lg:text-5xl">
            Our Location
          </h1>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            Visit our store or send us a message.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-10">
          {/* Map */}
          <div className="overflow-hidden rounded-xl border border-border bg-card/80 shadow-lg lg:col-span-3">
            <div className="h-[400px] w-full sm:h-[500px]">
              <LocationMapWrapper />
            </div>
            <div className="border-t border-border bg-muted/30 px-4 py-3">
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground hover:underline"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>

          {/* Company info + Contact form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card/80 p-6 shadow-sm">
              <h2 className="mb-6 font-serif text-xl tracking-tight text-foreground">
                Contact us
              </h2>
              <LocationContactForm />
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
