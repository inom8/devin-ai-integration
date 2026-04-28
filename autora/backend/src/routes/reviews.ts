import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

export const reviewsRouter = Router();

const createReviewSchema = z.object({
  targetType: z.enum(["SERVICE_PROVIDER", "TOWING_PROVIDER"]),
  targetId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

reviewsRouter.post(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const data = createReviewSchema.parse(req.body);

      const review = await prisma.review.create({
        data: {
          userId: req.user.userId,
          targetType: data.targetType,
          targetId: data.targetId,
          rating: data.rating,
          comment: data.comment,
        },
        include: { user: { select: { name: true, avatarUrl: true } } },
      });

      // Update provider rating
      const reviews = await prisma.review.findMany({
        where: { targetType: data.targetType, targetId: data.targetId },
      });
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      if (data.targetType === "SERVICE_PROVIDER") {
        await prisma.serviceProvider.update({
          where: { id: data.targetId },
          data: { rating: avgRating, reviewCount: reviews.length },
        });
      } else {
        await prisma.towingProvider.update({
          where: { id: data.targetId },
          data: { rating: avgRating, reviewCount: reviews.length },
        });
      }

      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues });
        return;
      }
      res.status(500).json({ error: "Failed to create review" });
    }
  }
);

reviewsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { targetType, targetId, limit, offset } = req.query;

    const where: Record<string, unknown> = {};
    if (targetType) where.targetType = targetType as string;
    if (targetId) where.targetId = targetId as string;

    const reviews = await prisma.review.findMany({
      where,
      include: { user: { select: { name: true, avatarUrl: true } } },
      take: parseInt(limit as string) || 20,
      skip: parseInt(offset as string) || 0,
      orderBy: { createdAt: "desc" },
    });

    res.json(reviews);
  } catch {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});
