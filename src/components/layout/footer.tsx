'use client';
import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Building2, ChevronRight } from 'lucide-react';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.25-.9 4.51-2.52 6.13-1.63 1.62-3.9 2.45-6.19 2.43-2.31-.02-4.6-1.01-6.17-2.73-1.55-1.74-2.28-4.08-2-6.41.27-2.3 1.44-4.42 3.23-5.87 1.77-1.44 4.09-2.07 6.36-1.8v4.06c-1.07-.15-2.21.14-3.08.77-.85.64-1.39 1.63-1.45 2.69-.06 1.05.35 2.13 1.07 2.9.72.76 1.78 1.14 2.85 1.07 1.05-.07 2.05-.63 2.67-1.47.6-.82.91-1.84.89-2.88.02-4.88-.01-9.76.02-14.64z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-foreground text-background font-sans pt-20 pb-8 border-t border-border/10">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">

          {/* Brand & Socials */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-background text-foreground flex items-center justify-center font-bold text-lg">
                M
              </div>
              <div className="flex flex-col">
                <span className="text-background text-sm font-bold tracking-widest uppercase">MJ Decor 888</span>
              </div>
            </div>
            <p className="text-background/60 text-sm leading-relaxed mb-8 max-w-xs">
              Mastering Light & Space. Premium Korean window solutions designed to elevate your living environment.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-background/20 flex items-center justify-center text-background/80 hover:bg-background hover:text-foreground hover:border-background transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-background/20 flex items-center justify-center text-background/80 hover:bg-background hover:text-foreground hover:border-background transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-background/20 flex items-center justify-center text-background/80 hover:bg-background hover:text-foreground hover:border-background transition-all">
                <TikTokIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col">
            <h4 className="text-sm font-bold tracking-widest uppercase mb-6 text-background/90 font-serif">Quick Links</h4>
            <div className="flex flex-col gap-4">
              {['Home', 'Shop Collections', 'About Us', 'Contact'].map((link) => (
                <Link key={link} href="#" className="text-background/60 hover:text-background text-sm flex items-center gap-2 group transition-colors">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-background/60" />
                  {link}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col">
            <h4 className="text-sm font-bold tracking-widest uppercase mb-6 text-background/90 font-serif">Contact</h4>
            <div className="flex flex-col gap-4 text-sm text-background/60 leading-relaxed">
              <p>Email: inquire@mjdecor.com</p>
              <p>Phone: +63 912 345 6789</p>
              <p>Address: <br />123 Design Avenue,<br /> Makati City, Metro Manila</p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="flex flex-col">
            <h4 className="text-sm font-bold tracking-widest uppercase mb-6 text-background/90 font-serif">Accepted Payments</h4>
            <div className="flex flex-wrap gap-3">
              {/* GCash Badge */}
              <div className="flex items-center gap-2 bg-[#0052FA]/20 border border-[#0052FA]/30 px-3 py-2 rounded-lg text-background text-xs font-bold tracking-wide">
                <div className="w-4 h-4 rounded-full bg-[#0052FA] flex items-center justify-center text-[8px] italic">G</div>
                GCash
              </div>
              {/* Maya Badge */}
              <div className="flex items-center gap-2 bg-[#12B76A]/20 border border-[#12B76A]/30 px-3 py-2 rounded-lg text-background text-xs font-bold tracking-wide">
                <div className="w-4 h-4 rounded-full bg-[#12B76A] flex items-center justify-center text-[8px] italic">M</div>
                Maya
              </div>
              {/* Bank Transfer Badge */}
              <div className="flex items-center gap-2 bg-background/10 border border-background/20 px-3 py-2 rounded-lg text-background text-xs font-bold tracking-wide w-full sm:w-auto">
                <Building2 className="w-4 h-4 text-background/80" />
                Bank Transfer
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium tracking-widest text-background/40 uppercase">
          <p>© 2026 MJ DECORS. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-background transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-background transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;