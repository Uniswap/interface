import { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId } from 'constants/chains';
interface SwitchNetworkArguments {
    library: Web3Provider;
    chainId: SupportedChainId;
}
export declare function switchToNetwork({ library, chainId }: SwitchNetworkArguments): Promise<null | void>;
export {};
