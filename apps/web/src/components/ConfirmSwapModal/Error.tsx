import { TradeSummary } from 'components/ConfirmSwapModal/TradeSummary'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { SwapResult } from 'hooks/useSwapCallback'
import { Trans, useTranslation } from 'react-i18next'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { isLimitTrade, isUniswapXTrade } from 'state/routing/utils'
import { ExternalLink } from 'theme/components/Links'
import { Button, Flex, Text } from 'ui/src'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

export enum PendingModalError {
  TOKEN_APPROVAL_ERROR = 0,
  PERMIT_ERROR = 1,
  XV2_HARD_QUOTE_ERROR = 2,
  CONFIRMATION_ERROR = 3,
  WRAP_ERROR = 4,
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
        message: <Trans i18nKey="error.tokenApproval.message" />,
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

// biome-ignore lint/suspicious/noShadowRestrictedNames: Error is appropriate component name here
export default function Error({ errorType, trade, showTrade, swapResult, onRetry }: ErrorModalContentProps) {
  const { title, message, supportArticleURL } = getErrorContent({ errorType, trade })
  const { t } = useTranslation()

  return (
    <Flex alignItems="center" p="$spacing8" gap="$spacing8">
      <Flex
        backgroundColor="$surface3"
        borderRadius="$rounded12"
        height="$spacing48"
        width="$spacing48"
        alignItems="center"
        justifyContent="center"
        mb="$spacing4"
      >
        <AlertTriangleFilled data-testid="pending-modal-failure-icon" size="24px" />
      </Flex>
      <Text variant="subheading1" color="$neutral1" mt="$spacing8">
        {title}
      </Text>
      <Text variant="body3" color="$neutral2">
        {message}
      </Text>
      <Flex gap="$gap8" justifyContent="center" alignItems="center">
        {showTrade && trade && <TradeSummary trade={trade} />}
        {supportArticleURL && <LearnMoreLink url={supportArticleURL} centered />}
        {swapResult && swapResult.type === TradeFillType.Classic && (
          <ExternalLink
            href={getExplorerLink({
              chainId: swapResult.response.chainId,
              data: swapResult.response.hash,
              type: ExplorerDataType.TRANSACTION,
            })}
            color="neutral2"
          >
            {t('common.viewOnExplorer')}
          </ExternalLink>
        )}
      </Flex>
      <Button variant="default" emphasis="secondary" minHeight="$spacing48" mt="$spacing8" onPress={onRetry}>
        {t('common.tryAgain.error')}
      </Button>
    </Flex>
  )
}
