import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { TradeSummary } from '~/pages/Swap/Limit/ConfirmLimitOrderModal/TradeSummary'
import { InterfaceTrade } from '~/state/routing/types'

export enum PendingModalError {
  TOKEN_APPROVAL_ERROR = 0,
  PERMIT_ERROR = 1,
  XV2_HARD_QUOTE_ERROR = 2,
  CONFIRMATION_ERROR = 3,
  WRAP_ERROR = 4,
}

interface ErrorModalContentProps {
  /** When omitted, renders nothing (stable subtree when the panel is always mounted). */
  errorType?: PendingModalError
  trade?: InterfaceTrade
  showTrade?: boolean
  onRetry: () => void
}

function getErrorContent(
  errorType: PendingModalError,
  t: TFunction,
): {
  title: string
  message?: string
  supportArticleURL?: string
} {
  switch (errorType) {
    case PendingModalError.TOKEN_APPROVAL_ERROR:
      return {
        title: t('error.tokenApproval'),
        message: t('error.tokenApproval.message'),
        supportArticleURL: UniswapHelpUrls.articles.approvalsExplainer,
      }
    case PendingModalError.PERMIT_ERROR:
      return {
        title: t('permit.approval.fail'),
        message: t('permit.approval.fail.message'),
        supportArticleURL: UniswapHelpUrls.articles.approvalsExplainer,
      }
    case PendingModalError.XV2_HARD_QUOTE_ERROR:
    case PendingModalError.CONFIRMATION_ERROR:
      return {
        title: t('common.limit.failed'),
        supportArticleURL: UniswapHelpUrls.articles.limitsFailure,
      }
    case PendingModalError.WRAP_ERROR:
      return {
        title: t('common.wrap.failed'),
        message: t('token.wrap.fail.message'),
        supportArticleURL: UniswapHelpUrls.articles.wethExplainer,
      }
    default:
      return {
        title: t('common.unknownError.error'),
      }
  }
}

export function Error({ errorType, trade, showTrade, onRetry }: ErrorModalContentProps) {
  const { t } = useTranslation()
  if (errorType === undefined) {
    return null
  }
  const { title, message, supportArticleURL } = getErrorContent(errorType, t)

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
        <AlertTriangleFilled color="$neutral2" data-testid="pending-modal-failure-icon" size="$icon.24" />
      </Flex>
      <Text variant="subheading1" color="$neutral1" mt="$spacing8">
        {title}
      </Text>
      {message ? (
        <Text variant="body3" color="$neutral2">
          {message}
        </Text>
      ) : null}
      <Flex gap="$gap8" justifyContent="center" alignItems="center">
        {showTrade && trade && <TradeSummary trade={trade} />}
        {supportArticleURL && <LearnMoreLink url={supportArticleURL} centered />}
      </Flex>
      <Button variant="default" emphasis="secondary" minHeight="$spacing48" mt="$spacing8" onPress={onRetry}>
        {t('common.tryAgain.error')}
      </Button>
    </Flex>
  )
}
