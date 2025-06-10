import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with CEC ID
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  cecId: text("cec_id").notNull().unique(), // Company Employee Code ID
});

// Seats table
export const seats = pgTable("seats", {
  id: serial("id").primaryKey(),
  seatId: text("seat_id").notNull().unique(), // Format: "1A", "2B", etc. or "APR231" or "QR1"
  row: integer("row").notNull(), // Row number
  column: text("column").notNull(), // Column letter
  type: text("type").notNull().default('seat'), // "seat", "apr", or "quiet"
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  seatId: text("seat_id").notNull(), // References seats.seatId
  date: text("date").notNull(), // ISO format date
  status: text("status").notNull(), // active, cancelled, expired
  createdAt: timestamp("created_at").notNull().defaultNow(),
  notes: text("notes"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  cecId: true,
});

export const insertSeatSchema = createInsertSchema(seats).pick({
  seatId: true,
  row: true,
  column: true,
  type: true,
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  userId: true,
  seatId: true,
  date: true,
  status: true,
  notes: true,
});

// Validation schemas
export const cecIdSchema = z.string().min(2).max(20);

export const reservationSchema = z.object({
  cecId: cecIdSchema,
  seatId: z.string().min(2).max(10),
  date: z.string(),
  notes: z.string().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSeat = z.infer<typeof insertSeatSchema> & { x?: number; y?: number };
export type Seat = typeof seats.$inferSelect & { x?: number; y?: number };

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type Reservation = z.infer<typeof reservationSchema>;

export type SeatStatus = "available" | "reserved" | "selected";

export type SeatWithStatus = {
  seatId: string;
  row: number;
  column: string;
  type: string;
  status: SeatStatus;
  x?: number;
  y?: number;
};
