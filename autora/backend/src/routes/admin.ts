import { Router, Response } from "express";
import prisma from "../utils/prisma";
import { authMiddleware, AuthRequest, requireRole } from "../middleware/auth";

export const adminRouter = Router();

adminRouter.get(
  "/stats",
  authMiddleware,
  requireRole("ADMIN"),
  async (_req: AuthRequest, res: Response) => {
    try {
      const [totalUsers, totalProviders, totalBookings, activeTowing] =
        await Promise.all([
          prisma.user.count(),
          prisma.serviceProvider.count(),
          prisma.booking.count(),
          prisma.towingRequest.count({
            where: {
              status: { in: ["REQUESTED", "ACCEPTED", "EN_ROUTE", "ARRIVED"] },
            },
          }),
        ]);

      res.json({ totalUsers, totalProviders, totalBookings, activeTowing });
    } catch {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  }
);

adminRouter.get(
  "/users",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { search, limit, offset } = req.query;
      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: "insensitive" } },
          { phone: { contains: search as string } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        },
        take: parseInt(limit as string) || 50,
        skip: parseInt(offset as string) || 0,
        orderBy: { createdAt: "desc" },
      });

      res.json(users);
    } catch {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

adminRouter.get(
  "/bookings",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, limit, offset } = req.query;
      const where: Record<string, unknown> = {};
      if (status) where.status = status as string;

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          user: { select: { name: true, phone: true } },
          provider: { select: { businessName: true } },
          providerService: { include: { category: true } },
        },
        take: parseInt(limit as string) || 50,
        skip: parseInt(offset as string) || 0,
        orderBy: { createdAt: "desc" },
      });

      res.json(bookings);
    } catch {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  }
);

adminRouter.get(
  "/towing",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, limit, offset } = req.query;
      const where: Record<string, unknown> = {};
      if (status) where.status = status as string;

      const requests = await prisma.towingRequest.findMany({
        where,
        include: {
          user: { select: { name: true, phone: true } },
          towingProvider: {
            include: { user: { select: { name: true } } },
          },
        },
        take: parseInt(limit as string) || 50,
        skip: parseInt(offset as string) || 0,
        orderBy: { createdAt: "desc" },
      });

      res.json(requests);
    } catch {
      res.status(500).json({ error: "Failed to fetch towing requests" });
    }
  }
);

adminRouter.put(
  "/providers/:id/verify",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const provider = await prisma.serviceProvider.update({
        where: { id: req.params.id as string },
        data: { isVerified: true },
      });
      res.json(provider);
    } catch {
      res.status(500).json({ error: "Failed to verify provider" });
    }
  }
);

adminRouter.put(
  "/providers/:id/revoke",
  authMiddleware,
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const provider = await prisma.serviceProvider.update({
        where: { id: req.params.id as string },
        data: { isVerified: false },
      });
      res.json(provider);
    } catch {
      res.status(500).json({ error: "Failed to revoke provider" });
    }
  }
);
