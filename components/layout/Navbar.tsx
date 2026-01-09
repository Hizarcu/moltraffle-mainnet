'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Dynamically import wallet components with no SSR
const ConnectButton = dynamic(
  () => import('@/components/wallet/ConnectButton').then(mod => ({ default: mod.ConnectButton })),
  { ssr: false }
);

const NetworkIndicator = dynamic(
  () => import('@/components/wallet/NetworkIndicator').then(mod => ({ default: mod.NetworkIndicator })),
  { ssr: false }
);

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: 'Explore' },
    { href: '/create', label: 'Create Raffle' },
    { href: '/my-raffles', label: 'My Raffles' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background-primary/80 backdrop-blur-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center font-bold text-white">
              RP
            </div>
            <span className="text-xl font-bold text-gradient">Raffle Party</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Network & Connect */}
          <div className="hidden md:flex items-center gap-3">
            <NetworkIndicator />
            <ConnectButton />
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-text-secondary hover:text-text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 space-y-3">
              <NetworkIndicator />
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
