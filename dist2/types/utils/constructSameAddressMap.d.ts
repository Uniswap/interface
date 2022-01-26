import { SupportedChainId } from '../constants/chains';
export declare function constructSameAddressMap<T extends string>(address: T, additionalNetworks?: SupportedChainId[]): {
    [chainId: number]: T;
};
