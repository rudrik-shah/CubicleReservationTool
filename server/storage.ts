import { users, seats, bookings } from "@shared/schema";
import type { User, InsertUser, Seat, InsertSeat, Booking, InsertBooking, SeatWithStatus } from "@shared/schema";
import { format, isAfter, isSameDay, parseISO } from "date-fns";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByCecId(cecId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Seat related methods
  getSeat(id: number): Promise<Seat | undefined>;
  getSeatBySeatId(seatId: string): Promise<Seat | undefined>;
  getAllSeats(): Promise<Seat[]>;
  createSeat(seat: InsertSeat): Promise<Seat>;
  
  // Booking related methods
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  getBookingsByCecId(cecId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  
  // Combined methods
  getSeatsWithStatusByDate(date: string): Promise<SeatWithStatus[]>;
  expireBookings(): Promise<void>;
  getActiveBookingBySeatIdAndDate(seatId: string, date: string): Promise<Booking | undefined>;
}

// Helper type for inserting seats with the type field
type InsertSeatWithType = InsertSeat & { type: string };

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByCecId(cecId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cecId, cecId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getSeat(id: number): Promise<Seat | undefined> {
    const [seat] = await db.select().from(seats).where(eq(seats.id, id));
    return seat;
  }
  
  async getSeatBySeatId(seatId: string): Promise<Seat | undefined> {
    const [seat] = await db.select().from(seats).where(eq(seats.seatId, seatId));
    return seat;
  }
  
  async getAllSeats(): Promise<Seat[]> {
    return await db.select().from(seats);
  }
  
  async createSeat(insertSeat: InsertSeatWithType): Promise<Seat> {
    const [seat] = await db
      .insert(seats)
      .values(insertSeat)
      .returning();
    return seat;
  }
  
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }
  
  async getBookingsByDate(date: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.date, date));
  }
  
  async getBookingsByCecId(cecId: string): Promise<Booking[]> {
    const user = await this.getUserByCecId(cecId);
    if (!user) return [];
    
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, user.id))
      .orderBy(desc(bookings.date));
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values({
        ...insertBooking,
        notes: insertBooking.notes || null
      })
      .returning();
    return booking;
  }
  
  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }
  
  async getSeatsWithStatusByDate(date: string): Promise<SeatWithStatus[]> {
    const allSeats = await this.getAllSeats();
    const dateBookings = await this.getBookingsByDate(date);
    
    // Get all active bookings for the date
    const activeBookings = dateBookings.filter(booking => booking.status === 'active');
    const reservedSeatIds = new Set(activeBookings.map(booking => booking.seatId));
    
    return allSeats.map(seat => ({
      seatId: seat.seatId,
      row: seat.row,
      column: seat.column,
      type: seat.type,
      status: reservedSeatIds.has(seat.seatId) ? 'reserved' : 'available'
    }));
  }
  
  async expireBookings(): Promise<void> {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Find all active bookings from previous days
    const activeBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.status, 'active'));
    
    // Expire them
    for (const booking of activeBookings) {
      const bookingDate = parseISO(booking.date);
      if (!isSameDay(bookingDate, today) && isAfter(today, bookingDate)) {
        await this.updateBookingStatus(booking.id, 'expired');
      }
    }
  }
  
  async getActiveBookingBySeatIdAndDate(seatId: string, date: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.seatId, seatId),
          eq(bookings.date, date),
          eq(bookings.status, 'active')
        )
      );
    return booking;
  }
  
  async initializeSeats(): Promise<void> {
    // Remove all existing seats
    const existingSeats = await this.getAllSeats();
    if (existingSeats.length > 0) {
      await db.delete(seats);
    }

    // Huddle Rooms (APR)
    const aprRooms = [
      { id: 'APR207', label: '207' },
      { id: 'APR208', label: '208' },
      { id: 'APR209', label: '209' },
      { id: 'APR210', label: '210' },
      { id: 'APR211', label: '211' },
      { id: 'APR212', label: '212' },
      { id: 'APR213', label: '213' }
    ];
    // Workstations (all others)
    const workstationIds = [
      // E block (leftmost)
      'E1-11','E1-12','E1-17','E1-18','E1-23','E1-24','E1-29','E1-30','E1-35',
      'E2-8','E2-9','E2-14','E2-15','E2-20','E2-21','E2-26','E2-27','E2-32','E2-33',
      // F block (middle)
      'F1-5','F1-6','F1-11','F1-12','F1-17','F1-18',
      'F2-2','F2-3','F2-8','F2-9','F2-14','F2-15',
      // F3/F4 block (bottom right)
      'F3-8','F3-4','F3-9','F3-10','F3-15','F3-16',
      // E3 block (rightmost)
      'E3-9','E3-10','E3-15','E3-16','E3-21','E3-22','E3-27','E3-28','E3-33','E3-34'
    ];

    // Add coordinates for all seats based on the provided floor plan image
    const seatCoords: Record<string, { x: number; y: number }> = {
      // Huddle Rooms (APR, center left)
      'APR207': { x: 470, y: 120 },
      'APR208': { x: 470, y: 180 },
      'APR209': { x: 470, y: 240 },
      'APR210': { x: 554, y: 300 },
      'APR211': { x: 554, y: 240 },
      'APR212': { x: 554, y: 180 },
      'APR213': { x: 554, y: 120 },
      // E block (leftmost)
      'E1-11': { x: 100, y: 100 },
      'E1-12': { x: 150, y: 100 },
      'E1-17': { x: 100, y: 150 },
      'E1-18': { x: 150, y: 150 },
      'E1-23': { x: 100, y: 200 },
      'E1-24': { x: 150, y: 200 },
      'E1-29': { x: 100, y: 250 },
      'E1-30': { x: 150, y: 250 },
      'E1-35': { x: 100, y: 300 },
      
      'E2-8': { x: 200, y: 100 },
      'E2-9': { x: 250, y: 100 },
      'E2-14': { x: 200, y: 150 },
      'E2-15': { x: 250, y: 150 },
      'E2-20': { x: 200, y: 200 },
      'E2-21': { x: 250, y: 200 },
      'E2-26': { x: 200, y: 250 },
      'E2-27': { x: 250, y: 250 },
      'E2-32': { x: 200, y: 300 },
      'E2-33': { x: 250, y: 300 },
      
      // F block (middle)
      'F1-5': { x: 300, y: 100 },
      'F1-6': { x: 350, y: 100 },
      'F1-11': { x: 300, y: 150 },
      'F1-12': { x: 350, y: 150 },
      'F1-17': { x: 300, y: 200 },
      'F1-18': { x: 350, y: 200 },
      
      'F2-2': { x: 400, y: 100 },
      'F2-3': { x: 450, y: 100 },
      'F2-8': { x: 400, y: 150 },
      'F2-9': { x: 450, y: 150 },
      'F2-14': { x: 400, y: 200 },
      'F2-15': { x: 450, y: 200 },
      
      // F3/F4 block (bottom right)
      'F3-8': { x: 500, y: 100 },
      'F3-4': { x: 550, y: 100 },
      'F3-9': { x: 500, y: 150 },
      'F3-10': { x: 550, y: 150 },
      'F3-15': { x: 500, y: 200 },
      'F3-16': { x: 550, y: 200 },
      
      // E3 block (rightmost)
      'E3-9': { x: 600, y: 100 },
      'E3-10': { x: 650, y: 100 },
      'E3-15': { x: 600, y: 150 },
      'E3-16': { x: 650, y: 150 },
      'E3-21': { x: 600, y: 200 },
      'E3-22': { x: 650, y: 200 },
      'E3-27': { x: 600, y: 250 },
      'E3-28': { x: 650, y: 250 },
      'E3-33': { x: 600, y: 300 },
      'E3-34': { x: 650, y: 300 },
    };

    // Insert workstations
    for (const seatId of workstationIds) {
      const coords = seatCoords[seatId] || { x: 0, y: 0 };
      await this.createSeat({
        seatId,
        row: 0,
        column: '',
        type: 'seat',
        x: coords.x,
        y: coords.y
      });
    }

    // Insert APRs (Huddle Rooms)
    for (const apr of aprRooms) {
      const coords = seatCoords[apr.id] || { x: 0, y: 0 };
      await this.createSeat({
        seatId: apr.id,
        row: 0,
        column: '',
        type: 'apr',
        x: coords.x,
        y: coords.y
      });
    }
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
