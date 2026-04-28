import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { authMiddleware, AuthRequest, requireRole } from "../middleware/auth";

export const providersRouter = Router();

const createProviderSchema = z.object({
  businessName: z.string().min(1),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  workingHoursJson: z.string().optional(),
  services: z
    .array(
      z.object({
        categoryId: z.string(),
        price: z.number().positive(),
        duration: z.number().int().positive().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

const updateProviderSchema = z.object({
  businessName: z.string().min(1).optional(),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  workingHoursJson: z.string().optional(),
});

providersRouter.post(
  "/",
  authMiddleware,
  requireRole("SERVICE_PROVIDER"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const data = createProviderSchema.parse(req.body);

      const provider = await prisma.serviceProvider.create({
        data: {
          userId: req.user.userId,
          businessName: data.businessName,
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          workingHoursJson: data.workingHoursJson,
          services: data.services
            ? {
                create: data.services.map((s) => ({
                  categoryId: s.categoryId,
                  price: s.price,
                  duration: s.duration,
                  description: s.description,
                })),
              }
            : undefined,
        },
        include: { services: { include: { category: true } } },
      });

      res.status(201).json(provider);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues });
        return;
      }
      res.status(500).json({ error: "Failed to create provider" });
    }
  }
);

providersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { category, minRating, limit, offset } = req.query;

    const where: Record<string, unknown> = { isVerified: true };
    if (category) {
      where.services = { some: { category: { name: category as string } } };
    }
    if (minRating) {
      where.rating = { gte: parseFloat(minRating as string) };
    }

    const providers = await prisma.serviceProvider.findMany({
      where,
      include: {
        services: { include: { category: true } },
        user: { select: { name: true, phone: true, avatarUrl: true } },
      },
      take: parseInt(limit as string) || 20,
      skip: parseInt(offset as string) || 0,
      orderBy: { rating: "desc" },
    });

    res.json(providers);
  } catch {
    res.status(500).json({ error: "Failed to fetch providers" });
  }
});

providersRouter.get("/nearby", async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius, category } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: "lat and lng are required" });
      return;
    }

    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string) || 10;

    const providers = await prisma.serviceProvider.findMany({
      where: {
        isVerified: true,
        ...(category
          ? { services: { some: { category: { name: category as string } } } }
          : {}),
      },
      include: {
        services: { include: { category: true } },
        user: { select: { name: true, avatarUrl: true } },
      },
    });

    // Haversine filter
    const R = 6371;
    const nearby = providers
      .map((p) => {
        const dLat = ((p.latitude - latNum) * Math.PI) / 180;
        const dLng = ((p.longitude - lngNum) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((latNum * Math.PI) / 180) *
            Math.cos((p.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return { ...p, distance: Math.round(distance * 100) / 100 };
      })
      .filter((p) => p.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearby);
  } catch {
    res.status(500).json({ error: "Failed to fetch nearby providers" });
  }
});

providersRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: req.params.id as string },
      include: {
        services: { include: { category: true } },
        user: { select: { name: true, phone: true, avatarUrl: true } },
      },
    });

    if (!provider) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }
    res.json(provider);
  } catch {
    res.status(500).json({ error: "Failed to fetch provider" });
  }
});

providersRouter.put(
  "/:id",
  authMiddleware,
  requireRole("SERVICE_PROVIDER", "ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = updateProviderSchema.parse(req.body);
      const provider = await prisma.serviceProvider.update({
        where: { id: req.params.id as string },
        data,
      });
      res.json(provider);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues });
        return;
      }
      res.status(500).json({ error: "Failed to update provider" });
    }
  }
);
