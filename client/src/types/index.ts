export interface Seat {
  seatId: string;
  row: number;
  column: string;
  type: 'seat' | 'apr' | 'quiet' | 'touchdown';
  status: 'available' | 'reserved' | 'selected';
  x?: number;
  y?: number;
}

export interface Booking {
  id: number;
  userId: number;
  seatId: string;
  date: string;
  status: 'active' | 'cancelled' | 'expired';
  createdAt: Date;
  notes?: string;
}

export interface User {
  id: number;
  username: string;
  cecId: string;
}

export interface ReservationFormData {
  cecId: string;
  seatId: string;
  date: string;
  notes?: string;
}
