import { Request, Response, NextFunction } from 'express';
export declare function generateSignature(fileId: string, expires: number): string;
export declare function getSignedUrl(fileId: string, type: 'preview' | 'thumbnail' | 'download', expiresIn?: number): string;
export declare function verifySignedUrl(req: Request): boolean;
export declare function requireAuthOrSignedUrl(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
