import { ReactNode } from 'react';
import { Provider as EthProvider } from 'widgets-web3-react/types';
interface Web3ProviderProps {
    jsonRpcEndpoint?: string;
    provider?: EthProvider;
    children: ReactNode;
}
export default function Web3Provider({ jsonRpcEndpoint, provider, children }: Web3ProviderProps): JSX.Element;
export {};
