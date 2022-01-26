import { Web3Provider } from '@ethersproject/providers';
import { SafeAppConnector } from '@gnosis.pm/safe-apps-web3-react';
import { InjectedConnector } from '@web3-react/injected-connector';
import { PortisConnector } from '@web3-react/portis-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { WalletLinkConnector } from '@web3-react/walletlink-connector';
import { FortmaticConnector } from './Fortmatic';
import { NetworkConnector } from './NetworkConnector';
export declare const network: NetworkConnector;
export declare function getNetworkLibrary(): Web3Provider;
export declare const injected: InjectedConnector;
export declare const gnosisSafe: SafeAppConnector;
export declare const walletconnect: WalletConnectConnector;
export declare const fortmatic: FortmaticConnector;
export declare const portis: PortisConnector;
export declare const walletlink: WalletLinkConnector;
