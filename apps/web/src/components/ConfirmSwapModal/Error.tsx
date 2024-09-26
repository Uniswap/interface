import { TradeSummary } from 'components/ConfirmSwapModal/TradeSummary'
import { DialogButtonType, DialogContent } from 'components/Dialog/Dialog'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { ColumnCenter } from 'components/deprecated/Column'
import { SwapResult } from 'hooks/useSwapCallback'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { isLimitTrade, isUniswapXTrade } from 'state/routing/utils'
import { ExternalLink } from 'theme/components'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Trans } from 'uniswap/src/i18n'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

export enum PendingModalError {
  TOKEN_APPROVAL_ERROR,
  PERMIT_ERROR,
  XV2_HARD_QUOTE_ERROR,
  CONFIRMATION_ERROR,
  WRAP_ERROR,
}

interface ErrorModalContentProps {
  errorType: PendingModalError
  trade?: InterfaceTrade
  showTrade?: boolean
  swapResult?: SwapResult
  onRetry: () => void
}

function getErrorContent({ errorType, trade }: { errorType: PendingModalError; trade?: InterfaceTrade }): {
  title: JSX.Element
  message?: JSX.Element
  supportArticleURL?: string
} {
  switch (errorType) {
    case PendingModalError.TOKEN_APPROVAL_ERROR:
      return {
        title: <Trans i18nKey="error.tokenApproval" />,
        message: <Trans i18nKey="error.access.expiry" />,
        supportArticleURL: uniswapUrls.helpArticleUrls.approvalsExplainer,
      }
    case PendingModalError.PERMIT_ERROR:
      return {
        title: <Trans i18nKey="permit.approval.fail" />,
        message: <Trans i18nKey="permit.approval.fail.message" />,
        supportArticleURL: uniswapUrls.helpArticleUrls.approvalsExplainer,
      }
    case PendingModalError.XV2_HARD_QUOTE_ERROR:
      return {
        title: <Trans i18nKey="common.swap.failed" />,
        message: <Trans i18nKey="swap.fail.uniswapX" />,
        supportArticleURL: uniswapUrls.helpArticleUrls.uniswapXFailure,
      }
    case PendingModalError.CONFIRMATION_ERROR:
      if (isLimitTrade(trade)) {
        return {
          title: <Trans i18nKey="common.limit.failed" />,
          supportArticleURL: uniswapUrls.helpArticleUrls.limitsFailure,
        }
      } else {
        return {
          title: <Trans i18nKey="common.swap.failed" />,
          message: <Trans i18nKey="swap.fail.message" />,
          supportArticleURL: isUniswapXTrade(trade)
            ? uniswapUrls.helpArticleUrls.uniswapXFailure
            : uniswapUrls.helpArticleUrls.transactionFailure,
        }
      }
    case PendingModalError.WRAP_ERROR:
      return {
        title: <Trans i18nKey="common.wrap.failed" />,
        message: <Trans i18nKey="token.wrap.fail.message" />,
        supportArticleURL: uniswapUrls.helpArticleUrls.wethExplainer,
      }
    default:
      return {
        title: <Trans i18nKey="common.unknownError.error" />,
        message: <Trans i18nKey="common.swap.failed" />,
      }
  }
}

export default function Error({ errorType, trade, showTrade, swapResult, onRetry }: ErrorModalContentProps) {
  const { title, message, supportArticleURL } = getErrorContent({ errorType, trade })

  return (
    <DialogContent
      isVisible={true}
      icon={<AlertTriangleFilled data-testid="pending-modal-failure-icon" size="24px" />}
      title={title}
      description={message}
      body={
        <ColumnCenter gap="sm">
          {showTrade && trade && <TradeSummary trade={trade} />}
          {supportArticleURL && (
            <ExternalLink href={supportArticleURL}>
              <Trans i18nKey="common.button.learn" />
            </ExternalLink>
          )}
          {swapResult && swapResult.type === TradeFillType.Classic && (
            <ExternalLink
              href={getExplorerLink(
                swapResult.response.chainId,
                swapResult.response.hash,
                ExplorerDataType.TRANSACTION,
              )}
              color="neutral2"
            >
              <Trans i18nKey="common.viewOnExplorer" />
            </ExternalLink>
          )}
        </ColumnCenter>
      }
      buttonsConfig={{
        left: {
          type: DialogButtonType.Primary,
          title: <Trans i18nKey="common.tryAgain.error" />,
          onClick: onRetry,
        },
      }}
      onCancel={() => null}
    />
  )
}
