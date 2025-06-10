// @ts-nocheck
import * as React from "react";
import { Seat } from '@/types';
import { cn } from "@/lib/utils";
// Install react-icons and react-select via podman script: npm install react-icons react-select
import { FaChair, FaDoorOpen } from "react-icons/fa";
import { MdMeetingRoom } from "react-icons/md";
import Select from "react-select";
import { Input } from "@/components/ui/input";

interface SeatMapProps {
  seats: Seat[];
  selectedSeatId: string | null;
  onSeatSelect: (seatId: string) => void;
  isLoading: boolean;
}

const IGNORED_SEATS: string[] = [
  "230 Mishmi", "C2-18", "C2-24", "B3-12", "B4-10", 
  "B4-22", "C4-4", "C4-5", "B4-11", "B1-12"
];

export function SeatMap({ seats, selectedSeatId, onSeatSelect, isLoading }: SeatMapProps) {
  const [search, setSearch] = React.useState("");
  const [selectedOption, setSelectedOption] = React.useState(null);

  // Filter out ignored seats
  const renderableSeats = React.useMemo(() => {
    if (!seats || !Array.isArray(seats)) return [];
    return seats.filter(seat => !IGNORED_SEATS.includes(seat.seatId));
  }, [seats]);

  // Options for react-select
  const seatOptions = React.useMemo(() =>
    renderableSeats.map(seat => ({
      value: seat.seatId,
      label: seat.seatId + (seat.type ? ` (${seat.type})` : ""),
      seat
    })),
    [renderableSeats]
  );

  // When a seat is selected from typeahead, update search and scroll to it
  const handleSelectChange = (option) => {
    setSelectedOption(option);
    setSearch(option ? option.value : "");
    // Optionally, auto-select the seat
    if (option) onSeatSelect(option.value);
  };

  // Search and sort alphabetically by seatId
  const filteredSeats = React.useMemo(() => {
    return [...renderableSeats]
      .filter(seat => seat.seatId.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.seatId.localeCompare(b.seatId));
  }, [renderableSeats, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40 w-full">
        <div className="animate-spin h-8 w-8 text-primary rounded-full border-2 border-t-transparent"></div>
        <p className="ml-4 text-lg">Loading seats...</p>
      </div>
    );
  }

  if (filteredSeats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No seats available.</p>
      </div>
    );
  }

  // Icon selection based on seat type
  function getSeatIcon(seat: Seat) {
    if (seat.type === 'apr') return <MdMeetingRoom className="w-4 h-4 text-blue-700" title="APR/Meeting Room" />;
    if (seat.type === 'touchdown') return <FaDoorOpen className="w-4 h-4 text-green-700" title="Touchdown" />;
    return <FaChair className="w-4 h-4 text-gray-700" title="Seat" />;
  }

  return (
    <div className="p-4 bg-white rounded-lg">
      <div className="mb-2 w-full max-w-xs">
        <Select
          options={seatOptions}
          value={seatOptions.find(opt => opt.value === selectedOption?.value) || null}
          onChange={handleSelectChange}
          placeholder="Type to search seat or APR..."
          isClearable
          classNamePrefix="react-select"
          styles={{
            menu: base => ({ ...base, zIndex: 100 }),
            input: base => ({ ...base, fontSize: '0.95rem' }),
            control: base => ({ ...base, minHeight: 36, fontSize: '0.95rem' })
          }}
        />
      </div>
      <div className="max-h-64 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {filteredSeats.map(seat => (
            <button
              key={seat.seatId}
              onClick={() => seat.status !== 'reserved' && onSeatSelect(seat.seatId)}
              disabled={seat.status === 'reserved'}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded border text-left text-xs transition-all min-w-0",
                seat.seatId === selectedSeatId
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-105'
                  : seat.status === 'reserved'
                  ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-70'
                  : 'bg-white text-gray-900 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400'
              )}
              title={`${seat.seatId}${seat.type ? ' (' + seat.type + ')' : ''} - ${seat.status}`}
            >
              {getSeatIcon(seat)}
              <span className="truncate">{seat.seatId}</span>
              {seat.status === 'reserved' && <span className="ml-1 text-[10px] text-red-500">Reserved</span>}
              {seat.seatId === selectedSeatId && <span className="ml-1 text-[10px] text-white bg-indigo-500 rounded px-1">Selected</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
