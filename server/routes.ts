import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  cecIdSchema,
  reservationSchema,
  insertBookingSchema,
  insertUserSchema,
} from "@shared/schema";
import { format, addDays } from "date-fns";
import schedule from "node-schedule";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a router for API routes
  const apiRouter = express.Router();

  // Schedule a job to expire bookings at end of day (23:59:59)
  schedule.scheduleJob("59 23 * * *", async () => {
    try {
      await storage.expireBookings();
      console.log("Expired bookings from previous days");
    } catch (err) {
      console.error("Error expiring bookings:", err);
    }
  });

  // Middleware to expire bookings on every request
  apiRouter.use(async (req, res, next) => {
    try {
      await storage.expireBookings();
      next();
    } catch (err) {
      next(err);
    }
  });

  // Get all seats with status for a specific date
  apiRouter.get("/seats", async (req: Request, res: Response) => {
    try {
      const dateQuerySchema = z.object({
        date: z.string(),
      });
      
      const result = dateQuerySchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters. Date is required." 
        });
      }
      
      const { date } = result.data;
      const seatsWithStatus = await storage.getSeatsWithStatusByDate(date);
      // Add x/y from the seat record if available
      const allSeats = await storage.getAllSeats();
      const seatCoordMap = Object.fromEntries(allSeats.map(s => [s.seatId, { x: s.x, y: s.y }]));
      const seatsWithCoords = seatsWithStatus.map(seat => ({
        ...seat,
        x: seatCoordMap[seat.seatId]?.x ?? 0,
        y: seatCoordMap[seat.seatId]?.y ?? 0
      }));
      res.json(seatsWithCoords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seats" });
    }
  });

  // Make a reservation
  apiRouter.post("/reservations", async (req: Request, res: Response) => {
    try {
      const validationResult = reservationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid reservation data",
          errors: validationResult.error.errors
        });
      }
      
      const { cecId, seatId, date, notes } = validationResult.data;
      
      // Check if seat exists
      const seat = await storage.getSeatBySeatId(seatId);
      if (!seat) {
        return res.status(404).json({ message: "Seat not found" });
      }
      
      // Check if seat is already booked for that date
      const existingBooking = await storage.getActiveBookingBySeatIdAndDate(seatId, date);
      if (existingBooking) {
        return res.status(409).json({ message: "This seat is already reserved for the selected date" });
      }
      
      // Get or create user
      let user = await storage.getUserByCecId(cecId);
      if (!user) {
        user = await storage.createUser({
          username: cecId, // Use ID as default username
          password: "password", // Default password
          cecId
        });
      }
      
      // Check if user already has a booking for this date
      const userBookings = await storage.getBookingsByCecId(cecId);
      const existingUserBookingForDate = userBookings.find(
        booking => booking.date === date && booking.status === 'active'
      );
      
      if (existingUserBookingForDate) {
        return res.status(409).json({ 
          message: "You already have a reservation for this date. One user can only reserve one seat/room per day."
        });
      }
      
      // Create booking
      const booking = await storage.createBooking({
        userId: user.id,
        seatId,
        date,
        status: "active",
        notes: notes || ""
      });
      
      res.status(201).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to create reservation" });
    }
  });

  // Get bookings for a user
  apiRouter.get("/bookings/:cecId", async (req: Request, res: Response) => {
    try {
      const validationResult = cecIdSchema.safeParse(req.params.cecId);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid CEC ID",
          errors: validationResult.error.errors
        });
      }
      
      const cecId = validationResult.data;
      const bookings = await storage.getBookingsByCecId(cecId);
      
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Cancel a booking
  apiRouter.patch("/bookings/:id/cancel", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.status !== "active") {
        return res.status(400).json({ message: "Only active bookings can be cancelled" });
      }
      
      const updatedBooking = await storage.updateBookingStatus(id, "cancelled");
      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Get all active bookings for a specific date (for admin panel)
  apiRouter.get("/bookings", async (req: Request, res: Response) => {
    try {
      const date = req.query.date as string;
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }
      // Get all bookings for the date
      const allBookings = await storage.getBookingsByDate(date);
      // Only active bookings
      const activeBookings = allBookings.filter(b => b.status === 'active');
      // Attach user CEC ID to each booking
      const bookingsWithCecId = await Promise.all(activeBookings.map(async (booking) => {
        const user = await storage.getUser(booking.userId);
        return {
          ...booking,
          cecId: user?.cecId || '',
        };
      }));
      res.json(bookingsWithCecId);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Mount the API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
