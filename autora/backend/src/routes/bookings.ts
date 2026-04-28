import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

export const bookingsRouter = Router();

const createBookingSchema = z.object({
  providerId: z.string().uuid(),
  providerServiceId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
  totalPrice: z.number().positive(),
});

const statusSchema = z.object({
  status: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED"]),
});

bookingsRouter.post(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const data = createBookingSchema.parse(req.body);

      const booking = await prisma.booking.create({
        data: {
          userId: req.user.userId,
          providerId: data.providerId,
          providerServiceId: data.providerServiceId,
          scheduledAt: new Date(data.scheduledAt),
          notes: data.notes,
          totalPrice: data.totalPrice,
        },
        include: {
          provider: true,
          providerService: { include: { category: true } },
        },
      });

      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues });
        return;
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  }
);

bookingsRouter.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { status } = req.query;

      const where: Record<string, unknown> = { userId: req.user.userId };
      if (status) {
        where.status = status as string;
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          provider: { include: { user: { select: { name: true } } } },
          providerService: { include: { category: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(bookings);
    } catch {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  }
);

bookingsRouter.get(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: req.params.id as string },
        include: {
          provider: { include: { user: { select: { name: true, phone: true } } } },
          providerService: { include: { category: true } },
          payment: true,
        },
      });

      if (!booking) {
        res.status(404).json({ error: "Booking not found" });
        return;
      }
      res.json(booking);
    } catch {
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  }
);

bookingsRouter.patch(
  "/:id/status",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { status } = statusSchema.parse(req.body);

      const booking = await prisma.booking.update({
        where: { id: req.params.id as string },
        data: { status },
      });

      res.json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues });
        return;
      }
      res.status(500).json({ error: "Failed to update booking status" });
    }
  }
);

bookingsRouter.patch(
  "/:id/cancel",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const booking = await prisma.booking.update({
        where: { id: req.params.id as string },
        data: { status: "CANCELLED" },
      });

      res.json(booking);
    } catch {
      res.status(500).json({ error: "Failed to cancel booking" });
    }
  }
);
