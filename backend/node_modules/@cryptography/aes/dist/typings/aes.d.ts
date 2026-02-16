/**
 * Low-level AES Cipher
 */
export default class AES {
    encKey: Uint32Array;
    decKey: Uint32Array;
    constructor(_key: string | Uint8Array | Uint32Array);
    encrypt(_message: string | Uint32Array | Uint8Array): Uint32Array;
    decrypt(_message: string | Uint32Array | Uint8Array): Uint32Array;
}
