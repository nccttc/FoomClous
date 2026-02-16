import { ObfuscatedConnection } from "./Connection";
import { AbridgedPacketCodec } from "./TCPAbridged";
import { Logger, PromisedNetSockets, PromisedWebSockets } from "../../extensions";
interface BasicProxyInterface {
    ip: string;
    port: number;
    timeout?: number;
    username?: string;
    password?: string;
}
export type MTProxyType = BasicProxyInterface & {
    secret: string;
    MTProxy: true;
};
export type SocksProxyType = BasicProxyInterface & {
    socksType: 4 | 5;
};
export type ProxyInterface = MTProxyType | SocksProxyType;
declare class MTProxyIO {
    header?: Buffer;
    private connection;
    private _encrypt?;
    private _decrypt?;
    private _packetClass;
    private _secret;
    private _dcId;
    constructor(connection: TCPMTProxy);
    initHeader(): Promise<void>;
    read(n: number): Promise<Buffer>;
    write(data: Buffer): void;
}
interface TCPMTProxyInterfaceParams {
    ip: string;
    port: number;
    dcId: number;
    loggers: Logger;
    proxy: ProxyInterface;
    socket: typeof PromisedNetSockets | typeof PromisedWebSockets;
    testServers: boolean;
}
export declare class TCPMTProxy extends ObfuscatedConnection {
    ObfuscatedIO: typeof MTProxyIO;
    _secret: Buffer;
    constructor({ ip, port, dcId, loggers, proxy, socket, testServers, }: TCPMTProxyInterfaceParams);
}
export declare class ConnectionTCPMTProxyAbridged extends TCPMTProxy {
    PacketCodecClass: typeof AbridgedPacketCodec;
}
export {};
