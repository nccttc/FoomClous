import { Request, Response, NextFunction } from 'express';
export interface ApiKeyInfo {
    id: string;
    name: string;
    permissions: string[];
}
declare global {
    namespace Express {
        interface Request {
            apiKeyInfo?: ApiKeyInfo;
        }
    }
}
export declare const validateApiKey: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const generateApiKey: () => string;
