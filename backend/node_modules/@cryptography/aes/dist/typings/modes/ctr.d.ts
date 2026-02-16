import AES from '../aes';
/**
 * AES-IGE mode.
 */
export default class AES_IGE {
    cipher: AES;
    key: Uint32Array;
    counter: Uint32Array;
    blockSize: number;
    offset: number;
    constructor(key: string | Uint32Array | Uint8Array, counter: string | Uint32Array | Uint8Array, blockSize?: number);
    /**
     * Encrypts plain text with AES-IGE mode.
     */
    encrypt(message: string | Uint32Array | Uint8Array, buf?: Uint32Array): Uint32Array;
    /**
     * Decrypts cipher text with AES-IGE mode.
     */
    decrypt(message: string | Uint32Array | Uint8Array, buf?: Uint32Array): Uint32Array;
    incrementCounter(): void;
}
