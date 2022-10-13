import { GetContractArgs } from '@wagmi/core';
export declare type UseContractConfig = GetContractArgs;
export declare const useContract: <Contract = any>({ addressOrName, contractInterface, signerOrProvider, }: UseContractConfig) => Contract;
