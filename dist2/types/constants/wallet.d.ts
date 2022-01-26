import { AbstractConnector } from '@web3-react/abstract-connector';
interface WalletInfo {
    connector?: AbstractConnector;
    name: string;
    iconURL: string;
    description: string;
    href: string | null;
    color: string;
    primary?: true;
    mobile?: true;
    mobileOnly?: true;
}
export declare const SUPPORTED_WALLETS: {
    [key: string]: WalletInfo;
};
export {};
