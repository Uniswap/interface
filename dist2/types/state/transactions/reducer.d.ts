import { SerializableTransactionReceipt, TransactionInfo } from './actions';
export interface TransactionDetails {
    hash: string;
    receipt?: SerializableTransactionReceipt;
    lastCheckedBlockNumber?: number;
    addedTime: number;
    confirmedTime?: number;
    from: string;
    info: TransactionInfo;
}
export interface TransactionState {
    [chainId: number]: {
        [txHash: string]: TransactionDetails;
    };
}
export declare const initialState: TransactionState;
declare const _default: import("redux").Reducer<TransactionState, import("redux").AnyAction>;
export default _default;
