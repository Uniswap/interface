import { SignTypedDataArgs, SignTypedDataResult } from '@wagmi/core';
import { MutationConfig } from '../../types';
export declare type UseSignTypedDataArgs = Partial<SignTypedDataArgs>;
export declare type UseSignTypedDataConfig = MutationConfig<SignTypedDataResult, Error, SignTypedDataArgs>;
export declare const mutationKey: (args: UseSignTypedDataArgs) => readonly [{
    readonly domain?: {
        name?: string | undefined;
        version?: string | undefined;
        chainId?: string | number | bigint | undefined;
        verifyingContract?: string | undefined;
        salt?: import("ethers").BytesLike | undefined;
    } | undefined;
    readonly types?: Record<string, {
        name: string;
        type: string;
    }[]> | undefined;
    readonly value?: Record<string, any> | undefined;
    readonly entity: "signTypedData";
}];
export declare function useSignTypedData({ domain, types, value, onError, onMutate, onSettled, onSuccess, }?: UseSignTypedDataArgs & UseSignTypedDataConfig): {
    data: string | undefined;
    error: Error | null;
    isError: boolean;
    isIdle: boolean;
    isLoading: boolean;
    isSuccess: boolean;
    reset: () => void;
    signTypedData: (args?: SignTypedDataArgs | undefined) => void;
    signTypedDataAsync: (args?: SignTypedDataArgs | undefined) => Promise<string>;
    status: "error" | "success" | "idle" | "loading";
    variables: SignTypedDataArgs | undefined;
};
