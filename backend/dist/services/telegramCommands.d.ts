import { Api } from 'telegram';
export declare function handleStart(message: Api.Message, senderId: number): Promise<void>;
export declare function handleHelp(message: Api.Message): Promise<void>;
export declare function handleStorage(message: Api.Message): Promise<void>;
export declare function handleList(message: Api.Message, args: string[]): Promise<void>;
export declare function handleDelete(message: Api.Message, args: string[]): Promise<void>;
export declare function handleTasks(message: Api.Message): Promise<void>;
