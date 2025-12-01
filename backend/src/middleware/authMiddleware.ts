import { Request, Response, NextFunction } from "express";
import jwt, { Algorithm } from "jsonwebtoken";
import { config } from "../config/env";

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Verify access token
    const decoded = jwt.verify(token, config.AUTH_SECRET_KEY, {
      algorithms: [config.AUTH_ALGORITHM as Algorithm],
    }) as any;

    // Attach user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(401).json({ error: "Authentication failed" });
  }
};
