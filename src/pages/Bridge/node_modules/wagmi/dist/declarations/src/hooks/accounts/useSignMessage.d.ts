import { SignMessageArgs, SignMessageResult } from '@wagmi/core';
import { MutationConfig } from '../../types';
export declare type UseSignMessageArgs = Partial<SignMessageArgs>;
export declare type UseSignMessageConfig = MutationConfig<SignMessageResult, Error, SignMessageArgs>;
export declare const mutationKey: (args: UseSignMessageArgs) => readonly [{
    readonly message?: string | import("ethers").Bytes | undefined;
    readonly entity: "signMessage";
}];
export declare function useSignMessage({ message, onError, onMutate, onSettled, onSuccess, }?: UseSignMessageArgs & UseSignMessageConfig): {
    data: string | undefined;
    error: Error | null;
    isError: boolean;
    isIdle: boolean;
    isLoading: boolean;
    isSuccess: boolean;
    reset: () => void;
    signMessage: (args?: SignMessageArgs | undefined) => void;
    signMessageAsync: (args?: SignMessageArgs | undefined) => Promise<string>;
    status: "error" | "success" | "idle" | "loading";
    variables: SignMessageArgs | undefined;
};
