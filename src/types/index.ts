export interface Location {
  lat: number;
  lng: number;
  address: string;
  placeId: string;
}

export interface RouteOption {
  id: number;
  duration: string;
  durationSeconds: number;
  distance: string;
  distanceMeters: number;
  hasTolls: boolean;
  polyline: string;
  legs: RouteLeg[];
}

export interface RouteLeg {
  distanceMeters: number;
  duration: string;
}

export interface RideData {
  pickup: Location;
  drop: Location;
  stops: Location[];
  date: string;
  time: string;
  timeFormat: 'AM' | 'PM';
  seats: number;
  preferences: string[];
  selectedRoute: RouteOption | null;
  totalDistance: number;
  totalDuration: number;
  settings: any;
}



export interface StopPoint {
  stopId: number;
  type: 'ORIGIN' | 'STOP' | 'DESTINATION';
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

