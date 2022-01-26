import { TransactionResponse } from '@ethersproject/providers';
import { TransactionInfo } from 'state/transactions/actions';
export declare function useTransactionMonitoringEventCallback(): (info: TransactionInfo, transactionResponse: TransactionResponse) => void;
export declare function useWalletConnectMonitoringEventCallback(): (walletAddress: any) => void;
