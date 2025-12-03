import { Link, useNavigate } from 'react-router-dom';
import { 
  Car, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Linkedin, 
  X 
} from 'lucide-react';

// Scroll to top function
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  // Handle navigation with scroll to top
  const handleNavigation = (path: string) => {
    navigate(path);
    scrollToTop();
  };

  const footerSections = [
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press', href: '/press' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'Find Ride', href: '/find-ride' },
        { label: 'Offer Ride', href: '/offer-ride' },
        { label: 'Safety', href: '/safety' },
        { label: 'Wallet', href: '/wallet' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/help' },
        { label: 'Safety Guidelines', href: '/safety' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
      ],
    },
    {
      title: 'Contact',
      links: [
        { 
          label: 'support@oolalala.com', 
          href: 'mailto:support@oolalala.com', 
          icon: Mail,
          isExternal: true 
        },
        { 
          label: '+1 (555) 123-4567', 
          href: 'tel:+15551234567', 
          icon: Phone,
          isExternal: true 
        },
        { 
          label: 'Chennai, India', 
          href: '#', 
          icon: MapPin 
        },
      ],
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: X, href: '#', label: 'Twitter (X)' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gradient-to-br from-blue-900 to-blue-950 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-16">

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {footerSections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-lg font-bold text-white/90">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.isExternal ? (
                      // External links
                      <a
                        href={link.href}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200 text-sm"
                        target={link.href.startsWith('#') ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                      >
                        {link.icon && <link.icon className="h-4 w-4" />}
                        {link.label}
                      </a>
                    ) : (
                      // Internal navigation links with scroll to top
                      <button
                        onClick={() => handleNavigation(link.href)}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200 text-sm w-full text-left"
                      >
                        {link.icon && <link.icon className="h-4 w-4" />}
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 mb-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-2 hover:opacity-90 transition-opacity"
            >
              <div className="bg-white p-2 rounded-lg">
                <Car className="h-6 w-6 text-blue-900" />
              </div>
              <span className="text-2xl font-bold">OOLALALA</span>
            </button>
            <p className="text-sm text-white/60">
              © {currentYear} OOLALALA. All rights reserved.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                aria-label={social.label}
                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-110"
                target="_blank"
                rel="noopener noreferrer"
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-8 border-t border-white/20 text-center">
          <p className="text-sm text-white/60">
            OOLALALA is committed to providing safe, reliable, and affordable ride-sharing services.
          </p>
        </div>

        {/* Scroll to Top Button - Mobile */}
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg lg:hidden transition-all duration-200 hover:scale-110 z-50"
          aria-label="Scroll to top"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      </div>
    </footer>
  );
};