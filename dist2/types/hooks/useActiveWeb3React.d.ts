import { Web3Provider } from '@ethersproject/providers';
export default function useActiveWeb3React(): {
    connector: import("widgets-web3-react/types").Connector;
    library: Web3Provider | undefined;
    chainId: number | undefined;
    account: string | undefined;
    active: boolean;
    error: Error | undefined;
} | import("@web3-react/core/dist/types").Web3ReactContextInterface<Web3Provider>;
