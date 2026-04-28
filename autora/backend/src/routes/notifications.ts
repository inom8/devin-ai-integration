import { Router, Response } from "express";
import prisma from "../utils/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      res.json(notifications);
    } catch {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  }
);

notificationsRouter.patch(
  "/:id/read",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const notification = await prisma.notification.update({
        where: { id: req.params.id as string },
        data: { isRead: true },
      });

      res.json(notification);
    } catch {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  }
);
