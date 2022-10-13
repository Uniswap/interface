import { SwitchNetworkArgs, SwitchNetworkResult } from '@wagmi/core';
import { MutationConfig } from '../../types';
export declare type UseSwitchNetworkArgs = Partial<SwitchNetworkArgs>;
export declare type UseSwitchNetworkConfig = MutationConfig<SwitchNetworkResult, Error, SwitchNetworkArgs> & {
    throwForSwitchChainNotSupported?: boolean;
};
export declare const mutationKey: (args: UseSwitchNetworkArgs) => readonly [{
    readonly chainId?: number | undefined;
    readonly entity: "switchNetwork";
}];
export declare function useSwitchNetwork({ chainId, throwForSwitchChainNotSupported, onError, onMutate, onSettled, onSuccess, }?: UseSwitchNetworkArgs & UseSwitchNetworkConfig): {
    readonly chains: import("@wagmi/core").Chain[];
    readonly data: import("@wagmi/core").Chain | undefined;
    readonly error: Error | null;
    readonly isError: boolean;
    readonly isIdle: boolean;
    readonly isLoading: boolean;
    readonly isSuccess: boolean;
    readonly pendingChainId: number | undefined;
    readonly reset: () => void;
    readonly status: "error" | "success" | "idle" | "loading";
    readonly switchNetwork: ((chainId_?: number | undefined) => void) | undefined;
    readonly switchNetworkAsync: ((chainId_?: number | undefined) => Promise<import("@wagmi/core").Chain>) | undefined;
    readonly variables: SwitchNetworkArgs | undefined;
};
