/// <reference types="node" />
/// <reference types="node" />
import { IAuthOptions } from "./AuthOptions";
import { AgentOptions } from "https";
import WebSocket = require("ws");
export declare type CertificateType = "pem" | "pfx";
export interface ICertificate {
    toAgentOptions(): AgentOptions;
    toWebSocketOptions(): WebSocket.ClientOptions;
}
export declare abstract class Certificate implements ICertificate {
    static readonly PEM: CertificateType;
    static readonly PFX: CertificateType;
    protected _certificate: string | Buffer;
    protected _ca: string | Buffer;
    protected _passphrase?: string;
    static createFromOptions(options: IAuthOptions): ICertificate;
    static createPem(certificate: string | Buffer, passphrase?: string, ca?: string | Buffer): PemCertificate;
    static createPfx(certificate: string | Buffer, passphrase?: string, ca?: string | Buffer): PfxCertificate;
    protected constructor(certificate: string | Buffer, passphrase?: string, ca?: string | Buffer);
    toAgentOptions(): AgentOptions;
    toWebSocketOptions(): WebSocket.ClientOptions;
}
export declare class PemCertificate extends Certificate {
    private readonly _certToken;
    private readonly _keyToken;
    protected _key: string;
    constructor(certificate: string | Buffer, passphrase?: string, ca?: string | Buffer);
    toAgentOptions(): AgentOptions;
    toWebSocketOptions(): WebSocket.ClientOptions;
    protected _fetchPart(token: string): string;
}
export declare class PfxCertificate extends Certificate {
    constructor(certificate: string | Buffer, passphrase?: string, ca?: string | Buffer);
    toAgentOptions(): AgentOptions;
    toWebSocketOptions(): WebSocket.ClientOptions;
}