import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiMoreVertical } from "react-icons/fi";
import { FaRoute } from "react-icons/fa";
import { toast } from "sonner";
import { reserveApi, RideRequest } from "@/services/reservationApi";

const ReserveList = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    fetchReservations();
  }, [currentPage]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      let clickedInsideDropdown = false;
      
      dropdownRefs.current.forEach((ref, id) => {
        if (ref && ref.contains(event.target as Node)) {
          clickedInsideDropdown = true;
        }
      });

      if (!clickedInsideDropdown) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reserveApi.getMyRequests(currentPage, 10);
      
      if (response.success && response.data) {
        const formattedReservations = response.data.rideRequests.map(request => ({
          ...request,
          city: reserveApi.extractCity(request.from_location_name),
          formattedDate: reserveApi.formatDate(request.travel_date),
          formattedTime: reserveApi.formatTime(request.travel_time)
        }));
        
        setReservations(formattedReservations);
        setTotalPages(response.data.totalPages);
      } else {
        toast.error("Failed to load reservations");
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      const response = await reserveApi.cancelRequest(requestId);
      
      if (response.success) {
        setReservations(prev => 
          prev.map(res => 
            res.request_id === requestId 
              ? { ...res, status: 'cancelled' } 
              : res
          )
        );
        toast.success("Request cancelled successfully");
        setOpenDropdownId(null); // Close dropdown after action
      } else {
        toast.error("Failed to cancel request");
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
    }
  };

  const toggleDropdown = (id: number) => {
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "pending":
      case "confirmed":
        return (
          <span className="px-3 py-1 bg-[#21409A] text-white text-xs font-medium rounded-full">
            Active
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
            Cancelled
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-500 text-white text-xs font-medium rounded-full">
            {status}
          </span>
        );
    }
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21409A] mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-3">
        {reservations.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaRoute className="text-gray-400 text-xl" />
            </div>
            <p className="text-gray-600 text-sm">No reservations found</p>
            <p className="text-gray-500 text-xs mt-1">You don't have any active ride reservations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reservations.map((reservation) => (
              <div
                key={reservation.request_id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 relative"
              >
                <div className="flex items-start gap-2">
                  {/* Route Icon */}
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaRoute className="text-[#21409A] text-lg" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {reservation.city || 'Unknown City'}
                      </h3>
                      <div className="flex items-center gap-1">
                        {getStatusBadge(reservation.status)}
                        
                        {/* CUSTOM DROPDOWN - NO SHADCN UI */}
                        <div 
                          ref={el => {
                            if (el) {
                              dropdownRefs.current.set(reservation.request_id, el);
                            } else {
                              dropdownRefs.current.delete(reservation.request_id);
                            }
                          }}
                          className="relative"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(reservation.request_id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <FiMoreVertical size={16} className="text-gray-500" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openDropdownId === reservation.request_id && (
                            <div className="absolute right-0 mt-1 bg-white shadow-lg border border-gray-200 rounded-md z-50 min-w-[140px]">
                              <button
                                onClick={() => handleCancelRequest(reservation.request_id)}
                                disabled={reservation.status === 'cancelled' || reservation.status === 'completed'}
                                className={`
                                  w-full text-left px-3 py-2 text-xs transition-colors
                                  ${reservation.status === 'cancelled' || reservation.status === 'completed'
                                    ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50'
                                    : 'text-red-600 cursor-pointer hover:bg-red-50'
                                  }
                                `}
                              >
                                Cancel Request
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-1 truncate">
                      {reservation.from_location_name || 'Unknown location'} → {reservation.to_location_name || 'Unknown destination'}
                    </p>
                    
                    {/* Seats Information */}
                    {reservation.seats_required && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-gray-400 text-xs">👤</span>
                        <span className="text-gray-600 text-xs">
                          {reservation.seats_required} seat{reservation.seats_required > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider and Time */}
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <div className="flex justify-between items-center">
                    <div className="text-gray-600 text-xs">
                      {reservation.formattedDate || reservation.travel_date}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {reservation.formattedTime || 'Time not set'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReserveList;