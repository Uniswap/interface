import { TransactionReceipt } from '@ethersproject/abstract-provider';
interface Transaction {
    addedTime: number;
    receipt?: unknown;
    lastCheckedBlockNumber?: number;
}
export declare function shouldCheck(lastBlockNumber: number, tx: Transaction): boolean;
interface UpdaterProps {
    pendingTransactions: {
        [hash: string]: Transaction;
    };
    onCheck: (tx: {
        chainId: number;
        hash: string;
        blockNumber: number;
    }) => void;
    onReceipt: (tx: {
        chainId: number;
        hash: string;
        receipt: TransactionReceipt;
    }) => void;
}
export default function Updater({ pendingTransactions, onCheck, onReceipt }: UpdaterProps): null;
export {};
