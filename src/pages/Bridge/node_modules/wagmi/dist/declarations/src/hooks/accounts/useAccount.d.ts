import { GetAccountResult } from '@wagmi/core';
export declare type UseAccountConfig = {
    /** Function to invoke when connected */
    onConnect?({ address, connector, isReconnected, }: {
        address?: GetAccountResult['address'];
        connector?: GetAccountResult['connector'];
        isReconnected: boolean;
    }): void;
    /** Function to invoke when disconnected */
    onDisconnect?(): void;
};
export declare function useAccount({ onConnect, onDisconnect }?: UseAccountConfig): GetAccountResult<import("@wagmi/core").Provider>;
