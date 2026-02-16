export declare const authenticatedUsers: Map<number, {
    authenticatedAt: Date;
}>;
export declare const passwordInputState: Map<number, {
    password: string;
}>;
export declare function loadAuthenticatedUsers(): Promise<void>;
export declare function persistAuthenticatedUser(userId: number): Promise<void>;
export declare function isAuthenticated(userId: number): boolean;
