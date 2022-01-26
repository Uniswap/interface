/// <reference types="react" />
import { SwapTransactionInfo, Transaction } from 'lib/state/transactions';
interface TransactionStatusProps {
    tx: Transaction<SwapTransactionInfo>;
    onClose: () => void;
}
export default function TransactionStatusDialog({ tx, onClose }: TransactionStatusProps): JSX.Element;
export {};
