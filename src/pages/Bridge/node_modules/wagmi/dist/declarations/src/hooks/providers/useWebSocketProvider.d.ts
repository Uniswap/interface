import { GetWebSocketProviderArgs, WebSocketProvider } from '@wagmi/core';
export declare type UseWebSocketProviderArgs = Partial<GetWebSocketProviderArgs>;
export declare function useWebSocketProvider<TWebSocketProvider extends WebSocketProvider>({ chainId }?: UseWebSocketProviderArgs): import("@wagmi/core").GetWebSocketProviderResult<TWebSocketProvider>;
