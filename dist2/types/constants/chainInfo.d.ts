import { SupportedChainId, SupportedL1ChainId, SupportedL2ChainId } from './chains';
/**
 * These are the network URLs used by the interface when there is not another available source of chain data
 */
export declare const INFURA_NETWORK_URLS: {
    [key in SupportedChainId]: string;
};
/**
 * This is used to call the add network RPC
 */
interface AddNetworkInfo {
    readonly rpcUrl: string;
    readonly nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
}
export declare enum NetworkType {
    L1 = 0,
    L2 = 1
}
interface BaseChainInfo {
    readonly networkType: NetworkType;
    readonly blockWaitMsBeforeWarning?: number;
    readonly docs: string;
    readonly bridge?: string;
    readonly explorer: string;
    readonly infoLink: string;
    readonly logoUrl: string;
    readonly label: string;
    readonly helpCenterUrl?: string;
    readonly addNetworkInfo: AddNetworkInfo;
}
export interface L1ChainInfo extends BaseChainInfo {
    readonly networkType: NetworkType.L1;
}
export interface L2ChainInfo extends BaseChainInfo {
    readonly networkType: NetworkType.L2;
    readonly bridge: string;
    readonly statusPage?: string;
    readonly defaultListUrl: string;
}
export declare type ChainInfoMap = {
    readonly [chainId: number]: L1ChainInfo | L2ChainInfo;
} & {
    readonly [chainId in SupportedL2ChainId]: L2ChainInfo;
} & {
    readonly [chainId in SupportedL1ChainId]: L1ChainInfo;
};
export declare const CHAIN_INFO: ChainInfoMap;
export {};
