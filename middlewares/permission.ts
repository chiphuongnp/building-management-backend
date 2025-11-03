import { NextFunction, Response } from 'express';
import { AuthRequest } from '../interfaces/jwt';

export const requireRole = (...requiredRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roles) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: No user role found',
      });
      return;
    }

    const hasRole = requiredRoles.includes(req.user.roles);
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Require role: ${requiredRoles.join(' or ')}`,
      });
    }
    next();
  };
};

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || [];
    const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Require permission: ${requiredPermissions.join(' or ')}`,
      });
    }
    next();
  };
};
