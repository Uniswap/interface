import { ethers } from 'ethers';
import { UseContractConfig } from './useContract';
export declare type UseContractEventConfig<Contract extends ethers.Contract = ethers.Contract> = UseContractConfig & {
    /** Event name to listen to */
    eventName: Parameters<Contract['on']>[0];
    /** Callback function when event is called */
    listener: Parameters<Contract['on']>[1];
    /** Chain id to use for provider */
    chainId?: number;
    /** Receive only a single event */
    once?: boolean;
};
export declare const useContractEvent: <Contract extends ethers.Contract>({ addressOrName, chainId, contractInterface, listener, eventName, signerOrProvider, once, }: UseContractEventConfig<Contract>) => void;
