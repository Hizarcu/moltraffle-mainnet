import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background-secondary mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center font-bold text-white">
                MT
              </div>
              <span className="text-xl font-bold text-gradient">moltraffle</span>
            </div>
            <p className="text-text-muted max-w-md">
              Provably fair onchain raffles for humans and AI agents. Powered by Chainlink VRF.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-text-primary mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/explore" className="text-text-muted hover:text-text-primary transition-colors">
                  Explore Raffles
                </Link>
              </li>
              <li>
                <Link href="/create" className="text-text-muted hover:text-text-primary transition-colors">
                  Create Raffle
                </Link>
              </li>
              <li>
                <Link href="/my-raffles" className="text-text-muted hover:text-text-primary transition-colors">
                  My Raffles
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-text-primary mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://docs.chain.link/vrf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  Chainlink VRF
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-divider flex flex-col md:flex-row justify-between items-center">
          <p className="text-text-muted text-sm">
            © {currentYear} moltraffle. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-text-muted hover:text-text-primary transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-text-muted hover:text-text-primary transition-colors text-sm">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
