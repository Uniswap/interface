/// <reference types="node" />
/// <reference types="node" />
import type { IncomingMessage } from 'http';
import { Readable } from 'stream';
export declare function requestToBodyStream(context: {
    ReadableStream: typeof ReadableStream;
}, stream: Readable): ReadableStream<any>;
export declare function bodyStreamToNodeStream(bodyStream: ReadableStream<Uint8Array>): Readable;
export interface ClonableBody {
    finalize(): Promise<void>;
    cloneBodyStream(): Readable;
}
export declare function getClonableBody<T extends IncomingMessage>(readable: T): ClonableBody;
