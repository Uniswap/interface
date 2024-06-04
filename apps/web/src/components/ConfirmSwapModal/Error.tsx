import { ColumnCenter } from 'components/Column'
import { SupportArticleURL } from 'constants/supportArticles'
import { SwapResult } from 'hooks/useSwapCallback'
import { Trans } from 'i18n'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { isLimitTrade, isUniswapXTrade } from 'state/routing/utils'
import { useTheme } from 'styled-components'

import { TradeSummary } from 'components/ConfirmSwapModal/TradeSummary'
import { DialogButtonType, DialogContent } from 'components/Dialog/Dialog'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { ExternalLink } from 'theme/components'

import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

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
  swapResult?: SwapResult
  onRetry: () => void
}

function getErrorContent({ errorType, trade }: { errorType: PendingModalError; trade?: InterfaceTrade }): {
  title: JSX.Element
  message?: JSX.Element
  supportArticleURL?: SupportArticleURL
} {
  switch (errorType) {
    case PendingModalError.TOKEN_APPROVAL_ERROR:
      return {
        title: <Trans i18nKey="error.tokenApproval" />,
        message: <Trans i18nKey="error.access.expiry" />,
        supportArticleURL: SupportArticleURL.APPROVALS_EXPLAINER,
      }
    case PendingModalError.PERMIT_ERROR:
      return {
        title: <Trans i18nKey="permit.approval.fail" />,
        message: <Trans i18nKey="permit.approval.fail.message" />,
        supportArticleURL: SupportArticleURL.APPROVALS_EXPLAINER,
      }
    case PendingModalError.XV2_HARD_QUOTE_ERROR:
      return {
        title: <Trans i18nKey="common.swap.failed" />,
        message: <Trans i18nKey="common.swap.failed.uniswapX" />,
        supportArticleURL: SupportArticleURL.UNISWAP_X_FAILURE,
      }
    case PendingModalError.CONFIRMATION_ERROR:
      if (isLimitTrade(trade)) {
        return {
          title: <Trans i18nKey="common.limit.failed" />,
          supportArticleURL: SupportArticleURL.LIMIT_FAILURE,
        }
      } else {
        return {
          title: <Trans i18nKey="common.swap.failed" />,
          message: <Trans i18nKey="common.swap.failed.message" />,
          supportArticleURL: isUniswapXTrade(trade)
            ? SupportArticleURL.UNISWAP_X_FAILURE
            : SupportArticleURL.TRANSACTION_FAILURE,
        }
      }
    case PendingModalError.WRAP_ERROR:
      return {
        title: <Trans i18nKey="common.wrap.failed" />,
        message: <Trans i18nKey="token.wrap.fail.message" />,
        supportArticleURL: SupportArticleURL.WETH_EXPLAINER,
      }
    default:
      return {
        title: <Trans i18nKey="common.unknownError.error" />,
        message: <Trans i18nKey="common.swap.failed" />,
      }
  }
}

export default function Error({ errorType, trade, swapResult, onRetry }: ErrorModalContentProps) {
  const theme = useTheme()
  const { title, message, supportArticleURL } = getErrorContent({ errorType, trade })

  return (
    <DialogContent
      isVisible={true}
      icon={<AlertTriangleFilled data-testid="pending-modal-failure-icon" fill={theme.neutral2} size="24px" />}
      title={title}
      description={message}
      body={
        <ColumnCenter gap="md">
          {trade && <TradeSummary trade={trade} />}
          {supportArticleURL && (
            <ExternalLink href={supportArticleURL}>
              <Trans i18nKey="common.learnMore.link" />
            </ExternalLink>
          )}
          {swapResult && swapResult.type === TradeFillType.Classic && (
            <ExternalLink
              href={getExplorerLink(
                swapResult.response.chainId,
                swapResult.response.hash,
                ExplorerDataType.TRANSACTION
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
          type: DialogButtonType.Accent,
          title: <Trans i18nKey="common.tryAgain.error" />,
          onClick: onRetry,
        },
      }}
      onCancel={() => null}
    />
  )
}
