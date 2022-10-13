import type { webpack } from 'next/dist/compiled/webpack/webpack';
import type ws from 'ws';
declare class EventStream {
    clients: Set<ws>;
    constructor();
    everyClient(fn: (client: ws) => void): void;
    close(): void;
    handler(client: ws): void;
    publish(payload: any): void;
}
export declare class WebpackHotMiddleware {
    eventStream: EventStream;
    clientLatestStats: {
        ts: number;
        stats: webpack.Stats;
    } | null;
    middlewareLatestStats: {
        ts: number;
        stats: webpack.Stats;
    } | null;
    serverLatestStats: {
        ts: number;
        stats: webpack.Stats;
    } | null;
    closed: boolean;
    constructor(compilers: webpack.Compiler[]);
    onClientInvalid: () => void;
    onClientDone: (statsResult: webpack.Stats) => void;
    onServerInvalid: () => void;
    onServerDone: (statsResult: webpack.Stats) => void;
    onEdgeServerInvalid: () => void;
    onEdgeServerDone: (statsResult: webpack.Stats) => void;
    /**
     * To sync we use the most recent stats but also we append middleware
     * errors. This is because it is possible that middleware fails to compile
     * and we still want to show the client overlay with the error while
     * the error page should be rendered just fine.
     */
    onHMR: (client: ws) => void;
    publishStats: (action: string, statsResult: webpack.Stats) => void;
    publish: (payload: any) => void;
    close: () => void;
}
export {};
