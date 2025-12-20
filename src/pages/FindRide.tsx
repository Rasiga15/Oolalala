import React from 'react';
import Navbar from '../components/layout/Navbar';
import SearchForm, { SearchData } from '../components/Findride/searchform';
import CuratedRoutes from '../components/Findride/curatedroute';

const FindRide: React.FC = () => {
  const handleSearch = (data: SearchData) => {
    console.log('Search data:', data);
    // Handle search logic here
  };

  const handleRouteSelect = (route: { from: string; to: string; price: number }) => {
    console.log('Selected route:', route);
    // Handle route selection
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Left Section - Search Form */}
            <div>
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Find your ride
                </h1>
                <p className="text-muted-foreground">
                  Affordable rides, trusted drivers
                </p>
              </div>

              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                <SearchForm onSearch={handleSearch} />
              </div>
            </div>

            {/* Right Section - Curated Routes */}
            <div className="lg:pt-16">
              <CuratedRoutes onRouteSelect={handleRouteSelect} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FindRide;