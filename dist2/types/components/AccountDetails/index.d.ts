/// <reference types="react" />
interface AccountDetailsProps {
    toggleWalletModal: () => void;
    pendingTransactions: string[];
    confirmedTransactions: string[];
    ENSName?: string;
    openOptions: () => void;
}
export default function AccountDetails({ toggleWalletModal, pendingTransactions, confirmedTransactions, ENSName, openOptions, }: AccountDetailsProps): JSX.Element;
export {};
