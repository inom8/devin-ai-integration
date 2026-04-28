import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

export const towingRouter = Router();

const createTowingSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  pickupAddress: z.string().optional(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  dropoffAddress: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["EN_ROUTE", "ARRIVED", "COMPLETED", "CANCELLED"]),
});

towingRouter.post(
  "/request",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const data = createTowingSchema.parse(req.body);

      const towingRequest = await prisma.towingRequest.create({
        data: {
          userId: req.user.userId,
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          pickupAddress: data.pickupAddress,
          dropoffLat: data.dropoffLat,
          dropoffLng: data.dropoffLng,
          dropoffAddress: data.dropoffAddress,
        },
      });

      res.status(201).json(towingRequest);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues });
        return;
      }
      res.status(500).json({ error: "Failed to create towing request" });
    }
  }
);

towingRouter.get("/nearby", async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: "lat and lng are required" });
      return;
    }

    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);

    const providers = await prisma.towingProvider.findMany({
      where: { isAvailable: true },
      include: { user: { select: { name: true, phone: true } } },
    });

    const R = 6371;
    const nearby = providers
      .filter((p) => p.latitude !== null && p.longitude !== null)
      .map((p) => {
        const dLat = ((p.latitude! - latNum) * Math.PI) / 180;
        const dLng = ((p.longitude! - lngNum) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((latNum * Math.PI) / 180) *
            Math.cos((p.latitude! * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return { ...p, distance: Math.round(distance * 100) / 100 };
      })
      .sort((a, b) => a.distance - b.distance);

    res.json(nearby);
  } catch {
    res.status(500).json({ error: "Failed to fetch nearby towing providers" });
  }
});

towingRouter.patch(
  "/:id/accept",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const towingProvider = await prisma.towingProvider.findUnique({
        where: { userId: req.user.userId },
      });

      if (!towingProvider) {
        res.status(403).json({ error: "Not a towing provider" });
        return;
      }

      const towingRequest = await prisma.towingRequest.update({
        where: { id: req.params.id as string },
        data: {
          towingProviderId: towingProvider.id,
          status: "ACCEPTED",
          estimatedArrival: new Date(Date.now() + 15 * 60 * 1000),
        },
        include: { towingProvider: { include: { user: { select: { name: true, phone: true } } } } },
      });

      res.json(towingRequest);
    } catch {
      res.status(500).json({ error: "Failed to accept towing request" });
    }
  }
);

towingRouter.patch(
  "/:id/status",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { status } = statusSchema.parse(req.body);

      const towingRequest = await prisma.towingRequest.update({
        where: { id: req.params.id as string },
        data: { status },
      });

      res.json(towingRequest);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues });
        return;
      }
      res.status(500).json({ error: "Failed to update towing status" });
    }
  }
);

towingRouter.get(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const towingRequest = await prisma.towingRequest.findUnique({
        where: { id: req.params.id as string },
        include: {
          user: { select: { name: true, phone: true } },
          towingProvider: {
            include: { user: { select: { name: true, phone: true } } },
          },
          payment: true,
        },
      });

      if (!towingRequest) {
        res.status(404).json({ error: "Towing request not found" });
        return;
      }
      res.json(towingRequest);
    } catch {
      res.status(500).json({ error: "Failed to fetch towing request" });
    }
  }
);
