import { Request, Response, NextFunction } from 'express';
declare const router: import("express-serve-static-core").Router;
export declare function hashPassword(password: string): string;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export default router;
