import React from 'react';
import { FileText, Shield, Leaf, IndianRupee } from "lucide-react";

const features = [
  { icon: FileText, title: "Easy Ride", subtitle: "Posting" },
  { icon: IndianRupee, title: "Smart Price", subtitle: "Suggestions" },
  { icon: Shield, title: "Fresh & Safe", subtitle: "Travel" },
  { icon: Leaf, title: "Eco-Friendly", subtitle: "Commute" },
];

export const WhyPassengersLove = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 text-center">

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-[#434447] mb-3">
          Why Passengers Love Our Rides!
        </h2>
        <p className="text-[#6E7486] text-lg mb-14 max-w-2xl mx-auto">
          Save money on every trip with optimized pricing and shared rides.
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 justify-items-center">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center">

              {/* === Outer Oval Button === */}
              <div className="w-36 h-44 rounded-full bg-[#F1F1F1] flex items-center justify-center">
                {/* Inner White Circle */}
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md">
                  <feature.icon className="w-7 h-7 text-[#434447]" />
                </div>
              </div>

              {/* === Text BELOW Circle === */}
              <div className="mt-4 text-center">
                <p className="text-[#434447] font-semibold text-base leading-tight">
                  {feature.title}
                </p>
                <p className="text-[#434447] font-semibold text-base leading-tight">
                  {feature.subtitle}
                </p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};