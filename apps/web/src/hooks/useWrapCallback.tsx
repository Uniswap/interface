import { Currency, Token, MaxUint256 } from "@taraswap/sdk-core";
import { InterfaceEventName } from "@uniswap/analytics-events";
import { useAccount } from "hooks/useAccount";
import { Trans } from "i18n";
import useNativeCurrency from "lib/hooks/useNativeCurrency";
import { formatToDecimal, getTokenAddress } from "lib/utils/analytics";
import tryParseCurrencyAmount from "lib/utils/tryParseCurrencyAmount";
import { useMemo, useState } from "react";
import { trace } from "tracing/trace";
import { sendAnalyticsEvent } from "uniswap/src/features/telemetry/send";
import { WrapType } from "uniswap/src/types/wrap";
import { logger } from "utilities/src/logger/logger";
import {
  WRAPPED_NATIVE_CURRENCY,
  STTARA_TARAXA,
  WRAPPED_STTARA_TARAXA,
} from "../constants/tokens";
import { useCurrencyBalance } from "../state/connection/hooks";
import { useTransactionAdder } from "../state/transactions/hooks";
import { TransactionType } from "../state/transactions/types";
import {
  useWETHContract,
  useERC4626Contract,
  useTokenContract,
} from "./useContract";
import { useTokenAllowance } from "./useTokenAllowance";

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE };

enum WrapInputError {
  NO_ERROR, // must be equal to 0 so all other errors are truthy
  ENTER_NATIVE_AMOUNT,
  ENTER_WRAPPED_AMOUNT,
  INSUFFICIENT_NATIVE_BALANCE,
  INSUFFICIENT_WRAPPED_BALANCE,
}

export function WrapErrorText({
  wrapInputError,
  tokenSymbolBase,
  tokenSymbolWrapped,
}: {
  wrapInputError: WrapInputError;
  tokenSymbolBase: string;
  tokenSymbolWrapped: string;
}) {
  switch (wrapInputError) {
    case WrapInputError.NO_ERROR:
      return null;
    case WrapInputError.ENTER_NATIVE_AMOUNT:
      return (
        <Trans i18nKey="swap.enterAmount" values={{ sym: tokenSymbolBase }} />
      );
    case WrapInputError.ENTER_WRAPPED_AMOUNT:
      return (
        <Trans
          i18nKey="swap.enterAmount"
          values={{ sym: tokenSymbolWrapped }}
        />
      );

    case WrapInputError.INSUFFICIENT_NATIVE_BALANCE:
      return (
        <Trans
          i18nKey="common.insufficientTokenBalance.error"
          values={{ tokenSymbol: tokenSymbolBase }}
        />
      );
    case WrapInputError.INSUFFICIENT_WRAPPED_BALANCE:
      return (
        <Trans
          i18nKey="common.insufficientTokenBalance.error"
          values={{ tokenSymbol: tokenSymbolWrapped }}
        />
      );
  }
}

export interface WrapState {
  wrapType: WrapType;
  execute?: () => Promise<string | undefined>;
  inputError?: WrapInputError;
  isApprovalNeeded?: boolean;
  isApproving?: boolean;
}

/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
  inputCurrency: Currency | undefined | null,
  outputCurrency: Currency | undefined | null,
  typedValue: string | undefined
): WrapState {
  const account = useAccount();
  const wethContract = useWETHContract();
  const wstTaraContract = useERC4626Contract(WRAPPED_STTARA_TARAXA.address);
  const stTaraContract = useTokenContract(STTARA_TARAXA.address);

  const [isApproving, setIsApproving] = useState(false);

  const balance = useCurrencyBalance(
    account.address,
    inputCurrency ?? undefined
  );
  const inputAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, inputCurrency ?? undefined),
    [inputCurrency, typedValue]
  );

  // Check allowance for stTARA -> wstTARA wrapping
  const stTaraAllowance = useTokenAllowance(
    STTARA_TARAXA,
    account.address ?? undefined,
    WRAPPED_STTARA_TARAXA.address
  );

  const addTransaction = useTransactionAdder();
  const [error, setError] = useState<Error>();
  if (error) throw error;

  return useMemo(() => {
    if (!account.chainId || !inputCurrency || !outputCurrency) {
      return NOT_APPLICABLE;
    }

    const weth = WRAPPED_NATIVE_CURRENCY[account.chainId];
    const stTara = STTARA_TARAXA;
    const wstTara = WRAPPED_STTARA_TARAXA;

    const hasInputAmount = Boolean(inputAmount?.greaterThan("0"));
    const isWrappingTaraOrStTara =
      (inputCurrency.isNative && weth?.equals(outputCurrency)) ||
      stTara.equals(inputCurrency);
    const sufficientBalance =
      inputAmount && balance && !balance.lessThan(inputAmount);

    // Check if approval is needed for stTARA -> wstTARA wrap
    const isApprovalNeeded =
      stTara.equals(inputCurrency) &&
      wstTara.equals(outputCurrency) &&
      stTaraAllowance?.tokenAllowance?.lessThan(inputAmount ?? "0");

    const eventProperties = {
      token_in_address: getTokenAddress(inputCurrency),
      token_out_address: getTokenAddress(outputCurrency),
      token_in_symbol: inputCurrency.symbol,
      token_out_symbol: outputCurrency.symbol,
      chain_id: inputCurrency.chainId,
      amount: inputAmount
        ? formatToDecimal(inputAmount, inputAmount?.currency.decimals)
        : undefined,
    };

    // Handle ETH <-> WETH
    if (inputCurrency.isNative && weth?.equals(outputCurrency)) {
      if (!wethContract) {
        return NOT_APPLICABLE;
      }
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? () =>
                trace({ name: "Wrap", op: "swap.wrap" }, async (trace) => {
                  const network = await wethContract.provider.getNetwork();
                  if (
                    network.chainId !== account.chainId ||
                    wethContract.address !==
                      WRAPPED_NATIVE_CURRENCY[network.chainId]?.address
                  ) {
                    sendAnalyticsEvent(
                      InterfaceEventName.WRAP_TOKEN_TXN_INVALIDATED,
                      {
                        ...eventProperties,
                        contract_address: wethContract.address,
                        contract_chain_id: network.chainId,
                        type: WrapType.WRAP,
                      }
                    );
                    const error = new Error(`Invalid WETH contract
Please file a bug detailing how this happened - https://github.com/Uniswap/interface/issues/new?labels=bug&template=bug-report.md&title=Invalid%20WETH%20contract`);
                    setError(error);
                    trace.setError(error, "out_of_range");
                    throw error;
                  }
                  const txReceipt = await trace.child(
                    { name: "Deposit", op: "wallet.send_transaction" },
                    () =>
                      wethContract.deposit({
                        value: `0x${inputAmount.quotient.toString(16)}`,
                      })
                  );
                  addTransaction(txReceipt, {
                    type: TransactionType.WRAP,
                    unwrapped: false,
                    currencyAmountRaw: inputAmount?.quotient.toString(),
                    chainId: account.chainId,
                  });
                  sendAnalyticsEvent(
                    InterfaceEventName.WRAP_TOKEN_TXN_SUBMITTED,
                    {
                      ...eventProperties,
                      type: WrapType.WRAP,
                    }
                  );
                  return txReceipt.hash;
                })
            : undefined,
        inputError: sufficientBalance
          ? undefined
          : hasInputAmount
          ? isWrappingTaraOrStTara
            ? WrapInputError.INSUFFICIENT_NATIVE_BALANCE
            : WrapInputError.INSUFFICIENT_WRAPPED_BALANCE
          : WrapInputError.ENTER_NATIVE_AMOUNT,
      };
    } else if (weth?.equals(inputCurrency) && outputCurrency.isNative) {
      if (!wethContract) {
        return NOT_APPLICABLE;
      }
      return {
        wrapType: WrapType.UNWRAP,
        execute:
          sufficientBalance && inputAmount
            ? () =>
                trace({ name: "Wrap", op: "swap.wrap" }, async (trace) => {
                  try {
                    const txReceipt = await trace.child(
                      { name: "Withdraw", op: "wallet.send_transaction" },
                      () =>
                        wethContract.withdraw(
                          `0x${inputAmount.quotient.toString(16)}`
                        )
                    );
                    addTransaction(txReceipt, {
                      type: TransactionType.WRAP,
                      unwrapped: true,
                      currencyAmountRaw: inputAmount?.quotient.toString(),
                      chainId: account.chainId,
                    });
                    sendAnalyticsEvent(
                      InterfaceEventName.WRAP_TOKEN_TXN_SUBMITTED,
                      {
                        ...eventProperties,
                        type: WrapType.UNWRAP,
                      }
                    );
                    return txReceipt.hash;
                  } catch (error) {
                    logger.warn(
                      "useWrapCallback",
                      "useWrapCallback",
                      "Failed to wrap",
                      error
                    );
                    throw error;
                  }
                })
            : undefined,
        inputError: sufficientBalance
          ? undefined
          : hasInputAmount
          ? isWrappingTaraOrStTara
            ? WrapInputError.INSUFFICIENT_WRAPPED_BALANCE
            : WrapInputError.INSUFFICIENT_NATIVE_BALANCE
          : WrapInputError.ENTER_WRAPPED_AMOUNT,
      };
    }
    // Handle stTARA <-> wstTARA
    else if (stTara.equals(inputCurrency) && wstTara.equals(outputCurrency)) {
      if (!wstTaraContract) {
        return NOT_APPLICABLE;
      }
      return {
        wrapType: WrapType.APPROVE_AND_WRAP,
        isApprovalNeeded,
        isApproving,
        execute: async () => {
          if (
            !sufficientBalance ||
            !inputAmount ||
            !wstTaraContract ||
            !stTaraContract
          ) {
            return;
          }
          try {
            // Handle approval if needed
            if (isApprovalNeeded) {
              setIsApproving(true);
              const approvalTx = await stTaraContract.approve(
                WRAPPED_STTARA_TARAXA.address,
                `0x${inputAmount.quotient.toString(16)}`
              );
              addTransaction(approvalTx, {
                type: TransactionType.APPROVAL,
                tokenAddress: stTara.address,
                spender: WRAPPED_STTARA_TARAXA.address,
                amount: `0x${inputAmount.quotient.toString(16)}`,
              });
              await approvalTx.wait();
              setIsApproving(false);
            }

            // Proceed with wrap
            const txReceipt = await wstTaraContract.deposit(
              `0x${inputAmount.quotient.toString(16)}`,
              account.address
            );
            addTransaction(txReceipt, {
              type: TransactionType.STAKED_WRAP,
              unwrapped: false,
              currencyAmountRaw: inputAmount?.quotient.toString(),
              chainId: account.chainId,
            });
            return txReceipt.hash;
          } catch (error) {
            setIsApproving(false);
            logger.error(error, {
              tags: { file: "useWrapCallback", function: "wrap" },
            });
            throw error;
          }
        },
        inputError: sufficientBalance
          ? undefined
          : hasInputAmount
          ? WrapInputError.INSUFFICIENT_NATIVE_BALANCE
          : WrapInputError.ENTER_NATIVE_AMOUNT,
      };
    } else if (wstTara.equals(inputCurrency) && stTara.equals(outputCurrency)) {
      return {
        wrapType: WrapType.APPROVE_AND_UNWRAP,
        execute: async () => {
          if (!sufficientBalance || !inputAmount || !wstTaraContract) {
            return;
          }
          try {
            const txReceipt = await wstTaraContract.redeem(
              `0x${inputAmount.quotient.toString(16)}`,
              account.address,
              account.address
            );
            addTransaction(txReceipt, {
              type: TransactionType.STAKED_WRAP,
              unwrapped: true,
              currencyAmountRaw: inputAmount?.quotient.toString(),
              chainId: account.chainId,
            });
            return txReceipt.hash;
          } catch (error) {
            logger.error(error, {
              tags: { file: "useWrapCallback", function: "unwrap" },
            });
            throw error;
          }
        },
        inputError: sufficientBalance
          ? undefined
          : hasInputAmount
          ? isWrappingTaraOrStTara
            ? WrapInputError.INSUFFICIENT_NATIVE_BALANCE
            : WrapInputError.INSUFFICIENT_WRAPPED_BALANCE
          : WrapInputError.ENTER_WRAPPED_AMOUNT,
      };
    }

    return NOT_APPLICABLE;
  }, [
    account.chainId,
    account.address,
    inputCurrency,
    outputCurrency,
    inputAmount,
    balance,
    wethContract,
    wstTaraContract,
    stTaraContract,
    stTaraAllowance,
    isApproving,
    addTransaction,
  ]);
}
