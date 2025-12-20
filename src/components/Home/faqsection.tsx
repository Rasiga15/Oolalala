import React, { useState } from 'react';
import { Button } from '../common/Button'; 

const faqs = [
  {
    question: "How do I book a ride?",
    answer: 'Select your pickup and drop-off points, choose the date, and tap "Find Ride."',
  },
  {
    question: "Can I cancel a ride?",
    answer: "Yes, you can cancel a ride before the scheduled departure time through the app.",
  },
  {
    question: "Are my rides safe?",
    answer: "All our drivers are verified and we have safety features built into every ride.",
  },
  {
    question: "Can I share a ride with friends?",
    answer: "Absolutely! You can add co-passengers when booking your ride.",
  },
  {
    question: "Are there options for seniors or kids?",
    answer: "Yes, we offer special accommodations for seniors and families with children.",
  },
  {
    question: "How do I pay for a ride?",
    answer: "We accept multiple payment methods including cards, UPI, and wallet payments.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Frequently asked questions
          </h2>
          <p className="text-gray-600">
            Everything you need to know about the product and billing.
          </p>
        </div>

        {/* FAQ List without Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center p-5 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <span className="text-gray-500">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              {openIndex === index && (
                <div className="p-5 bg-white border-t border-gray-100">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions section */}
        <div className="mt-12 text-center">
          {/* Avatar group */}
          <div className="flex justify-center -space-x-2 mb-4">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
              alt="Team member"
              className="w-10 h-10 rounded-full border-2 border-white object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
              alt="Team member"
              className="w-10 h-10 rounded-full border-2 border-white object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
              alt="Team member"
              className="w-10 h-10 rounded-full border-2 border-white object-cover"
            />
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 text-sm mb-4">
            Can't find the answer you're looking for? Please chat to our friendly team.
          </p>
          
          {/* Using your custom Button component */}
          <Button 
            variant="default"
            size="default"
            className="bg-[#21409A] hover:bg-[#21409A]/90 text-white"
          >
            Get in touch
          </Button>
        </div>
      </div>
    </section>
  );
};