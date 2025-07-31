import { TransactionRequest } from "@ethersproject/providers";
import { NonEmptyArray } from "utilities/src/primitives/array";

// moved to transactions/types to avoid circular dependency
export type PopulatedTransactionRequestArray = NonEmptyArray<ValidatedTransactionRequest>
export type ValidatedTransactionRequest = TransactionRequest & { to: string; chainId: number }
