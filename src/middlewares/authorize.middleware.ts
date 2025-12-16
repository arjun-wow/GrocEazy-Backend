import type { Request, Response, NextFunction } from "express";

export const authorize = (roles: string[] = []) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (roles.length && !roles.includes(user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    };
};
