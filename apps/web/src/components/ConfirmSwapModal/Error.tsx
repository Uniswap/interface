import { ColumnCenter } from 'components/Column'
import { SupportArticleURL } from 'constants/supportArticles'
import { SwapResult } from 'hooks/useSwapCallback'
import { Trans } from 'i18n'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { isLimitTrade } from 'state/routing/utils'
import { useTheme } from 'styled-components'

import { TradeSummary } from 'components/ConfirmSwapModal/TradeSummary'
import { DialogButtonType, DialogContent } from 'components/Dialog/Dialog'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { ExternalLink } from 'theme/components'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

export enum PendingModalError {
  TOKEN_APPROVAL_ERROR,
  PERMIT_ERROR,
  CONFIRMATION_ERROR,
  WRAP_ERROR,
}

interface ErrorModalContentProps {
  errorType: PendingModalError
  trade?: InterfaceTrade
  swapResult?: SwapResult
  onRetry: () => void
}

function getErrorContent({
  errorType,
  trade,
  swapResult,
}: {
  errorType: PendingModalError
  swapResult?: SwapResult
  trade?: InterfaceTrade
}): {
  title: JSX.Element
  message?: JSX.Element
  supportArticleURL?: SupportArticleURL
} {
  switch (errorType) {
    case PendingModalError.TOKEN_APPROVAL_ERROR:
      return {
        title: <Trans>Token approval failed</Trans>,
        message: (
          <Trans>
            This provides the Uniswap protocol access to your token for trading. For security, it expires after 30 days.
          </Trans>
        ),
        supportArticleURL: SupportArticleURL.APPROVALS_EXPLAINER,
      }
    case PendingModalError.PERMIT_ERROR:
      return {
        title: <Trans>Permit approval failed</Trans>,
        message: <Trans>Permit2 allows token approvals to be shared and managed across different applications.</Trans>,
        supportArticleURL: SupportArticleURL.APPROVALS_EXPLAINER,
      }
    case PendingModalError.CONFIRMATION_ERROR:
      if (isLimitTrade(trade)) {
        return {
          title: <Trans>Limit failed</Trans>,
          supportArticleURL: SupportArticleURL.LIMIT_FAILURE,
        }
      } else {
        return {
          title: <Trans>Swap failed</Trans>,
          message: <Trans>Try adjusting slippage to a higher value.</Trans>,
          supportArticleURL:
            swapResult?.type === TradeFillType.UniswapX
              ? SupportArticleURL.UNISWAP_X_FAILURE
              : SupportArticleURL.TRANSACTION_FAILURE,
        }
      }
    case PendingModalError.WRAP_ERROR:
      return {
        title: <Trans>Wrap failed</Trans>,
        message: (
          <Trans>
            Swaps on the Uniswap Protocol can start and end with ETH. However, during the swap ETH is wrapped into WETH.
          </Trans>
        ),
        supportArticleURL: SupportArticleURL.WETH_EXPLAINER,
      }
    default:
      return {
        title: <Trans>Unknown Error</Trans>,
        message: (
          <Trans>
            Your swap could not be executed. Please check your network connection and your slippage settings.
          </Trans>
        ),
      }
  }
}

export default function Error({ errorType, trade, swapResult, onRetry }: ErrorModalContentProps) {
  const theme = useTheme()
  const { title, message, supportArticleURL } = getErrorContent({ errorType, swapResult, trade })

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
              <Trans>Learn more</Trans>
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
              <Trans>View on Explorer</Trans>
            </ExternalLink>
          )}
        </ColumnCenter>
      }
      buttonsConfig={{
        left: {
          type: DialogButtonType.Accent,
          title: <Trans>Try again</Trans>,
          onClick: onRetry,
        },
      }}
      onCancel={() => null}
    />
  )
}
