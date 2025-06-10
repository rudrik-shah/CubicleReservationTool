import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

// Force production mode if not set
process.env.NODE_ENV = process.env.NODE_ENV || "production";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  log(`Starting server in NODE_ENV: ${process.env.NODE_ENV}`);
  try {
    // Initialize database with seats
    await storage.initializeSeats();
    log('Database initialized with seats');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Explicit logs for mode
  if (process.env.NODE_ENV === "development") {
    log("Using Vite dev server (development mode)");
    await setupVite(app, server);
  } else {
    log("Using static file serving (production mode)");
    serveStatic(app);
  }

  // Use PORT from environment or default to 3000
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown for SIGTERM and SIGINT
  const shutdown = () => {
    log('Received shutdown signal, shutting down gracefully...');
    server.close(() => {
      log('Server closed.');
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
})();

