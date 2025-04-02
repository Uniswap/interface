import Column from "components/Column";
import { ConfirmModalState } from "components/ConfirmSwapModal";
import { Sign } from "components/Icons/Sign";
import { Swap } from "components/Icons/Swap";
import CurrencyLogo from "components/Logo/CurrencyLogo";
import { SupportArticleURL } from "constants/supportArticles";
import { useAccount } from "hooks/useAccount";
import { useBlockConfirmationTime } from "hooks/useBlockConfirmationTime";
import { useColor } from "hooks/useColor";
import { SwapResult } from "hooks/useSwapCallback";
import { t } from "i18n";
import useNativeCurrency from "lib/hooks/useNativeCurrency";
import { useEffect, useMemo, useState } from "react";
import { InterfaceTrade } from "state/routing/types";
import {
  isLimitTrade,
  isUniswapXSwapTrade,
  isUniswapXTradeType,
} from "state/routing/utils";
import { useOrder } from "state/signatures/hooks";
import {
  useIsTransactionConfirmed,
  useSwapTransactionStatus,
} from "state/transactions/hooks";
import styled, { useTheme } from "styled-components";
import { colors } from "theme/colors";
import { Divider } from "theme/components";
import { UniswapXOrderStatus } from "types/uniswapx";
import { TransactionStatus } from "uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks";
import { SignatureExpiredError } from "utils/errors";

import { Step, StepDetails, StepStatus } from "./Step";

const DividerContainer = styled(Column)`
  height: 28px;
  padding: 0px 16px;
  justify-content: center;
`;
const Edge = styled.div`
  width: 2px;
  height: 10px;
  background-color: ${({ theme }) => theme.neutral3};
  margin: 0px 27px;
`;
type ProgressIndicatorStep = Extract<
  ConfirmModalState,
  | ConfirmModalState.APPROVING_TOKEN
  | ConfirmModalState.PERMITTING
  | ConfirmModalState.PENDING_CONFIRMATION
  | ConfirmModalState.WRAPPING
  | ConfirmModalState.RESETTING_TOKEN_ALLOWANCE
>;
export default function ProgressIndicator({
  steps,
  currentStep,
  trade,
  swapResult,
  wrapTxHash,
  tokenApprovalPending = false,
  revocationPending = false,
  swapError,
  onRetryUniswapXSignature,
}: {
  steps: ProgressIndicatorStep[];
  currentStep: ProgressIndicatorStep;
  trade?: InterfaceTrade;
  swapResult?: SwapResult;
  wrapTxHash?: string;
  tokenApprovalPending?: boolean;
  revocationPending?: boolean;
  swapError?: Error | string;
  onRetryUniswapXSignature?: () => void;
}) {
  const { chainId } = useAccount();
  const nativeCurrency = useNativeCurrency(chainId);
  const inputTokenColor = useColor(trade?.inputAmount.currency.wrapped);
  const theme = useTheme();

  // Dynamic estimation of transaction wait time based on confirmation of previous block
  const { blockConfirmationTime } = useBlockConfirmationTime();
  const [estimatedTransactionTime, setEstimatedTransactionTime] =
    useState<number>();
  useEffect(() => {
    // Value continuously updates as new blocks get confirmed
    // Only set step timers once to prevent resetting
    if (blockConfirmationTime && !estimatedTransactionTime) {
      // Add buffer to account for variable confirmation
      setEstimatedTransactionTime(Math.ceil(blockConfirmationTime * 1.2));
    }
  }, [blockConfirmationTime, estimatedTransactionTime]);

  const swapStatus = useSwapTransactionStatus(swapResult);
  const uniswapXOrder = useOrder(
    isUniswapXTradeType(swapResult?.type) ? swapResult.response.orderHash : ""
  );

  const swapConfirmed =
    swapStatus === TransactionStatus.Confirmed ||
    uniswapXOrder?.status === UniswapXOrderStatus.FILLED;
  const wrapConfirmed = useIsTransactionConfirmed(wrapTxHash);

  const swapPending = swapResult !== undefined && !swapConfirmed;
  const wrapPending = wrapTxHash != undefined && !wrapConfirmed;
  const transactionPending =
    revocationPending || tokenApprovalPending || wrapPending || swapPending;

  // Retry logic for UniswapX orders when a signature expires
  const [signatureExpiredErrorId, setSignatureExpiredErrorId] = useState("");
  useEffect(() => {
    if (
      swapError instanceof SignatureExpiredError &&
      swapError.id !== signatureExpiredErrorId
    ) {
      setSignatureExpiredErrorId(swapError.id);
      onRetryUniswapXSignature?.();
    }
  }, [onRetryUniswapXSignature, signatureExpiredErrorId, swapError]);

  function getStatus(targetStep: ProgressIndicatorStep) {
    const currentIndex = steps.indexOf(currentStep);
    const targetIndex = steps.indexOf(targetStep);
    if (currentIndex < targetIndex) {
      return StepStatus.PREVIEW;
    } else if (currentIndex === targetIndex) {
      return transactionPending ? StepStatus.IN_PROGRESS : StepStatus.ACTIVE;
    } else {
      return StepStatus.COMPLETE;
    }
  }

  const stepDetails: Record<ProgressIndicatorStep, StepDetails> = useMemo(
    () => ({
      [ConfirmModalState.WRAPPING]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} />,
        rippleColor: inputTokenColor,
        previewTitle: t("common.wrap", {
          symbol: trade?.inputAmount.currency.symbol,
        }),
        actionRequiredTitle: t("common.wrapIn", {
          symbol: trade?.inputAmount.currency.symbol,
        }),
        inProgressTitle: t("common.wrappingToken", {
          symbol: trade?.inputAmount.currency.symbol,
        }),
        learnMoreLinkText: t("common.whyWrap", {
          symbol: trade?.inputAmount.currency.symbol,
        }),
        learnMoreLinkHref: SupportArticleURL.WETH_EXPLAINER,
      },
      [ConfirmModalState.RESETTING_TOKEN_ALLOWANCE]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} />,
        rippleColor: inputTokenColor,
        previewTitle: t("common.resetLimit", {
          symbol: trade?.inputAmount.currency.symbol,
        }),
        actionRequiredTitle: t("common.resetLimitWallet", {
          symbol: trade?.inputAmount.currency.symbol,
        }),
        inProgressTitle: t("common.resettingLimit", {
          symbol: trade?.inputAmount.currency.symbol,
        }),
      },
      [ConfirmModalState.APPROVING_TOKEN]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} />,
        rippleColor: inputTokenColor,
        previewTitle: t("common.approveSpend", {
          symbol: trade?.inputAmount.currency.symbol,
        }),
        actionRequiredTitle: t("common.wallet.approve"),
        inProgressTitle: t("common.approvePending"),
        learnMoreLinkText: t("common.whyApprove"),
        learnMoreLinkHref: SupportArticleURL.APPROVALS_EXPLAINER,
      },
      [ConfirmModalState.PERMITTING]: {
        icon: <Sign />,
        rippleColor: theme.accent1,
        previewTitle: t("common.signMessage"),
        actionRequiredTitle: t("common.signMessageWallet"),
        learnMoreLinkText: t("common.whySign"),
        learnMoreLinkHref: SupportArticleURL.APPROVALS_EXPLAINER,
      },
      [ConfirmModalState.PENDING_CONFIRMATION]: {
        icon: <Swap />,
        rippleColor: colors.blue400,
        previewTitle: isLimitTrade(trade)
          ? t("common.confirm")
          : t("swap.confirmSwap"),
        actionRequiredTitle: isLimitTrade(trade)
          ? t("common.confirmWallet")
          : t("common.confirmSwap"),
        inProgressTitle: isLimitTrade(trade)
          ? t("common.pendingEllipsis")
          : t("common.swapPending"),
        ...(isUniswapXSwapTrade(trade) && {
          timeToStart:
            trade.order.info.deadline - Math.floor(Date.now() / 1000),
          delayedStartTitle: t("common.confirmTimedOut"),
        }),
        learnMoreLinkText: isLimitTrade(trade)
          ? t("limits.learnMore")
          : t("common.learnMoreSwap"),
        learnMoreLinkHref: isLimitTrade(trade)
          ? SupportArticleURL.LEARN_ABOUT_LIMITS
          : SupportArticleURL.HOW_TO_SWAP_TOKENS,
      },
    }),
    [inputTokenColor, nativeCurrency.symbol, trade, theme.accent1]
  );

  if (steps.length === 0) {
    return null;
  }

  return (
    <Column>
      <DividerContainer>
        <Divider />
      </DividerContainer>
      {steps.map((step, i) => {
        return (
          <div key={`progress-indicator-step-${i}`}>
            <Step
              stepStatus={getStatus(step)}
              stepDetails={stepDetails[step]}
            />
            {i !== steps.length - 1 && <Edge />}
          </div>
        );
      })}
    </Column>
  );
}
