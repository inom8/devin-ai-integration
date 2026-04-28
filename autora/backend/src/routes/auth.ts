import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "../utils/prisma";
import { authMiddleware, AuthRequest, generateToken } from "../middleware/auth";

export const authRouter = Router();

const otpStore = new Map<string, { code: string; expiresAt: number }>();

const sendOtpSchema = z.object({
  phone: z.string().min(9).max(15),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(9).max(15),
  code: z.string().length(6),
});

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.enum(["DRIVER", "SERVICE_PROVIDER", "TOWING_PROVIDER"]),
  password: z.string().min(6).optional(),
});

authRouter.post("/send-otp", async (req: Request, res: Response) => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

    // TODO: Integrate with Eskiz.uz SMS API
    // For development, log the OTP
    console.log(`OTP for ${phone}: ${code}`);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues });
      return;
    }
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

authRouter.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const { phone, code } = verifyOtpSchema.parse(req.body);
    const stored = otpStore.get(phone);

    if (!stored || stored.code !== code || stored.expiresAt < Date.now()) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    otpStore.delete(phone);

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({ data: { phone } });
    }

    const token = generateToken({ userId: user.id, role: user.role });
    res.json({
      token,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
      isNewUser: !user.name,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues });
      return;
    }
    res.status(500).json({ error: "Verification failed" });
  }
});

authRouter.post(
  "/register",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { name, role, password } = registerSchema.parse(req.body);

      const data: Record<string, unknown> = { name, role };
      if (password) {
        data.passwordHash = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id: req.user.userId },
        data,
      });

      const token = generateToken({ userId: user.id, role: user.role });
      res.json({
        token,
        user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.issues });
        return;
      }
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

authRouter.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});
