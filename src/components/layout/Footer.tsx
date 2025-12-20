import React from 'react';
import { FaLeaf } from 'react-icons/fa';
// Import your logo image
import rectangleLogo from '../../assets/Rectangle.svg'; // Adjust path as needed

// Change from const Footer = () => { to export const Footer = () => {
export const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Tagline - Now with rectangle.svg image */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {/* Added rectangle.svg image */}
             <img 
  src={rectangleLogo} 
  alt="Oolalala Logo"
  className="h-12 w-auto max-w-[200px] object-contain"
/>

              
             
            </div>
            <p className="text-gray-500 text-sm italic leading-relaxed">
              "Oolalala Carpooling makes daily travel smart, safe, and affordable. Share rides with ease, eco-friendly journey every time."
            </p>
          </div>

          {/* Company Links - Updated with bold text */}
          <div>
            <h3 className="text-gray-400 font-medium mb-4 text-sm uppercase tracking-wide">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-700 hover:text-[#21409A] transition-colors text-sm font-bold">
                  Find Ride
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-[#21409A] transition-colors text-sm font-bold">
                  Offer Ride
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-[#21409A] transition-colors text-sm font-bold">
                  History
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-[#21409A] transition-colors text-sm font-bold">
                  Wallet
                </a>
              </li>
            </ul>
          </div>

          {/* Help Links - Updated with bold text */}
          <div>
            <h3 className="text-gray-400 font-medium mb-4 text-sm uppercase tracking-wide">Help</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-700 hover:text-[#21409A] transition-colors text-sm font-bold">
                  Customer Support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-[#21409A] transition-colors text-sm font-bold">
                  24/7 Support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-[#21409A] transition-colors text-sm font-bold">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-[#21409A] transition-colors text-sm font-bold">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-gray-400 font-medium mb-4 text-sm uppercase tracking-wide">Newsletter</h3>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent"
              />
              <button className="w-full bg-[#21409A] text-white py-2.5 px-4 rounded-md text-sm font-bold hover:bg-[#21409A]/90 transition-colors shadow-md hover:shadow-lg">
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-200 py-4">
        <p className="text-center text-gray-500 text-sm">
          © Copyright 2025. All Rights Reserved by Oolalala
        </p>
      </div>
    </footer>
  );
};

