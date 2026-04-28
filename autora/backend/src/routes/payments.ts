import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

export const paymentsRouter = Router();

const createPaymentSchema = z.object({
  bookingId: z.string().uuid().optional(),
  towingRequestId: z.string().uuid().optional(),
  amount: z.number().positive(),
  method: z.enum(["PAYME", "CLICK", "CASH"]),
});

paymentsRouter.post(
  "/create",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const data = createPaymentSchema.parse(req.body);

      if (!data.bookingId && !data.towingRequestId) {
        res
          .status(400)
          .json({ error: "Either bookingId or towingRequestId is required" });
        return;
      }

      const payment = await prisma.payment.create({
        data: {
          userId: req.user.userId,
          bookingId: data.bookingId,
          towingRequestId: data.towingRequestId,
          amount: data.amount,
          method: data.method,
        },
      });

      // TODO: Initiate payment with Payme/Click API based on method
      // For now, return payment record with pending status

      res.status(201).json(payment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues });
        return;
      }
      res.status(500).json({ error: "Failed to create payment" });
    }
  }
);

paymentsRouter.post("/webhook", async (req: Request, res: Response) => {
  try {
    // TODO: Verify webhook signature from Payme/Click
    const { transactionId, status } = req.body;

    if (!transactionId) {
      res.status(400).json({ error: "Transaction ID required" });
      return;
    }

    // Find payment by transactionId and update status
    const payment = await prisma.payment.findFirst({
      where: { transactionId },
    });

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: status === "completed" ? "COMPLETED" : "FAILED" },
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Webhook processing failed" });
  }
});
