import React from 'react';
import carpoolImage from '../../assets/HomeAbout.png';

export const AboutSection = () => {
  return (
    <section className="bg-white py-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Main Heading */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            <span className="bg-gradient-to-r from-[#279A21] to-[#0D340B] bg-clip-text text-transparent">
              Sharing Miles Saves the Planet
            </span>
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Column - Image */}
          <div className="flex-1 flex justify-center">
            <img
              src={carpoolImage}
              alt="Carpooling illustration"
              className="max-w-full h-auto max-h-96 object-contain"
            />
          </div>

          {/* Right Column - Content */}
          <div className="flex-1">
            {/* Sub-headings in p tags as requested */}
           <div className="space-y-4 mb-6 text-center">
  <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0D340B] to-[#279A21] bg-clip-text text-transparent">
    Travel Smarter. Travel better
  </p>
  
  <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0D340B] to-[#279A21] bg-clip-text text-transparent">
    Travel Now.
  </p>
</div>

            
            <p className="text-gray-600 text-lg leading-relaxed">
              Carpooling means fewer cars and less CO₂ emissions. Just one shared 
              ride can save up to <span className="text-[#279A21] font-semibold">150 kg of CO₂</span> per 
              person per year. Plus, fewer vehicles on the road help improve air 
              quality and reduce traffic congestion.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};