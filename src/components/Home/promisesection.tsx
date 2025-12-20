import React from 'react';
import { FaDollarSign, FaUserCheck, FaClock, FaLeaf } from 'react-icons/fa';

const features = [
  {
    icon: FaDollarSign,
    title: 'Affordable Rides',
    description: 'Save more than traditional travel options.',
    bgColor: 'bg-[#21409A]/10',
    iconColor: 'text-[#21409A]',
  },
  {
    icon: FaUserCheck,
    title: 'Verified Members',
    description: 'Every driver ID-checked for your safety purpose.',
    bgColor: 'bg-[#279A21]/10',
    iconColor: 'text-[#279A21]',
  },
  {
    icon: FaClock,
    title: 'Flexible Timings',
    description: 'Find a ride that leaves exactly when you need to go.',
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-500',
  },
  {
    icon: FaLeaf,
    title: 'Eco-Friendly',
    description: 'Reduce your carbon footprint by sharing the journey.',
    bgColor: 'bg-[#279A21]/10',
    iconColor: 'text-[#279A21]',
  },
];

export const PromiseSection: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        {/* Header */}
        <p className="text-[#21409A] font-semibold text-sm uppercase tracking-wide mb-2">
          OUR PROMISE
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Why Million Love Oolalala
        </h2>
        <p className="text-gray-600 mb-12">
          We're changing the way the world travels, one shared ride at a time.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};