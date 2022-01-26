/// <reference types="react" />
export default function WalletModal({ pendingTransactions, confirmedTransactions, ENSName, }: {
    pendingTransactions: string[];
    confirmedTransactions: string[];
    ENSName?: string;
}): JSX.Element;
