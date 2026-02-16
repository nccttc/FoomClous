export declare const pool: import("pg").Pool;
export declare const query: (text: string, params?: unknown[]) => Promise<import("pg").QueryResult<any>>;
declare const _default: {
    pool: import("pg").Pool;
    query: (text: string, params?: unknown[]) => Promise<import("pg").QueryResult<any>>;
};
export default _default;
