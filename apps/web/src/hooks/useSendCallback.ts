import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Currency, CurrencyAmount } from "@taraswap/sdk-core";
import { useSupportedChainId } from "constants/chains";
import { useAccount } from "hooks/useAccount";
import { useEthersProvider } from "hooks/useEthersProvider";
import { useSwitchChain } from "hooks/useSwitchChain";
import { GasFeeResult } from "hooks/useTransactionGasFee";
import { useCallback } from "react";
import { useTransactionAdder } from "state/transactions/hooks";
import { SendTransactionInfo, TransactionType } from "state/transactions/types";
import { trace } from "tracing/trace";
import { currencyId } from "utils/currencyId";
import { UserRejectedRequestError, toReadableError } from "utils/errors";
import { didUserReject } from "utils/swapErrorToUserReadableMessage";

export function useSendCallback({
  currencyAmount,
  recipient,
  transactionRequest,
  gasFee,
}: {
  currencyAmount?: CurrencyAmount<Currency>;
  recipient?: string;
  transactionRequest?: TransactionRequest;
  gasFee?: GasFeeResult;
}) {
  const account = useAccount();
  const provider = useEthersProvider({ chainId: account.chainId });
  const addTransaction = useTransactionAdder();
  const switchChain = useSwitchChain();
  const supportedTransactionChainId = useSupportedChainId(
    transactionRequest?.chainId
  );

  return useCallback(
    () =>
      trace({ name: "Send", op: "send" }, async (trace) => {
        console.log("trace", trace);
        if (account.status !== "connected") {
          throw new Error("wallet must be connected to send");
        }
        console.log("provider", provider);
        if (!provider) {
          throw new Error("missing provider");
        }
        console.log("transactionRequest", transactionRequest);
        if (!transactionRequest) {
          throw new Error("missing to transaction to execute");
        }
        console.log("currencyAmount", currencyAmount);
        if (!currencyAmount) {
          throw new Error("missing currency amount to send");
        }
        console.log("recipient", recipient);
        if (!recipient) {
          throw new Error("missing recipient");
        }
        console.log("supportedTransactionChainId", supportedTransactionChainId);
        if (!supportedTransactionChainId) {
          throw new Error("missing chainId in transactionRequest");
        }
        console.log("supportedTransactionChainId", supportedTransactionChainId);
        try {
          console.log("sending transaction");
          const response = await trace.child(
            { name: "Send transaction", op: "wallet.send_transaction" },
            async (walletTrace) => {
              console.log("account.chainId", account.chainId);
              try {
                if (account.chainId !== supportedTransactionChainId) {
                  await switchChain(supportedTransactionChainId);
                }
                return await provider.getSigner().sendTransaction({
                  ...transactionRequest,
                  ...gasFee?.params,
                });
              } catch (error) {
                console.log("error", error);
                if (didUserReject(error)) {
                  walletTrace.setStatus("cancelled");
                  throw new UserRejectedRequestError(
                    `Transfer failed: User rejected signature`
                  );
                } else {
                  throw error;
                }
              }
            }
          );
          console.log("response", response);
          const sendInfo: SendTransactionInfo = {
            type: TransactionType.SEND,
            currencyId: currencyId(currencyAmount.currency),
            amount: currencyAmount.quotient.toString(),
            recipient,
          };
          addTransaction(response, sendInfo);
        } catch (error) {
          if (error instanceof UserRejectedRequestError) {
            trace.setStatus("cancelled");
            throw error;
          } else {
            throw toReadableError(`Transfer failed:`, error);
          }
        }
      }),
    [
      account.status,
      account.chainId,
      provider,
      transactionRequest,
      currencyAmount,
      recipient,
      addTransaction,
      gasFee?.params,
      supportedTransactionChainId,
      switchChain,
    ]
  );
}
