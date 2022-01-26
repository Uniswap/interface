import { Web3ReactState } from 'lib/state/web3';
import { Web3ReactHooks } from 'widgets-web3-react/core';
export declare function useActiveWeb3ReactState(): Web3ReactState;
export declare function useActiveWeb3ReactHooks(): Web3ReactHooks;
export default function useActiveWeb3React(): {
    connector: import("widgets-web3-react/types").Connector;
    library: import("@ethersproject/providers").Web3Provider | undefined;
    chainId: number | undefined;
    account: string | undefined;
    active: boolean;
    error: Error | undefined;
};
