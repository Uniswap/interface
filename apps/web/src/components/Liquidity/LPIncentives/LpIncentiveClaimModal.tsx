import { Token } from '@uniswap/sdk-core'
import { useFormattedTokenRewards } from 'components/Liquidity/LPIncentives/hooks/useFormattedTokenRewards'
import { useLpIncentiveClaimButtonConfig } from 'components/Liquidity/LPIncentives/hooks/useLpIncentiveClaimButtonConfig'
import { useLpIncentiveClaimMutation } from 'components/Liquidity/LPIncentives/hooks/useLpIncentiveClaimMutation'
import { LP_INCENTIVES_REWARD_TOKEN } from 'components/LpIncentives/constants'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Image, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

interface LpIncentiveClaimModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  token?: Token
  tokenRewards: string
  isPendingTransaction?: boolean
  iconUrl?: string
}

export function LpIncentiveClaimModal({
  isOpen,
  onClose,
  onSuccess,
  token = LP_INCENTIVES_REWARD_TOKEN,
  tokenRewards,
  isPendingTransaction = false,
  iconUrl,
}: LpIncentiveClaimModalProps) {
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const formattedTokenRewards = useFormattedTokenRewards({ tokenRewards, token })

  const { mutate: claim, isPending } = useLpIncentiveClaimMutation({
    token,
    onSuccess,
    onClose,
    onError: (error) => {
      // For wallet rejections, we don't need to show an error
      if (didUserReject(error)) {
        return
      }

      logger.error(error, {
        tags: {
          file: 'LpIncentiveClaimModal',
          function: 'useLpIncentiveClaimMutation',
        },
      })
      setError(t('pool.incentives.collectFailed'))
    },
  })

  const handleClaim = useEvent(({ skipAnalytics = false }: { skipAnalytics?: boolean } = {}) => {
    if (!skipAnalytics) {
      sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsRetry)
    }
    setError(null)
    claim()
  })

  // Only auto-claim when the modal opens and there's no pending transaction
  useEffect(() => {
    if (isOpen && !isPendingTransaction) {
      handleClaim({ skipAnalytics: true })
    }
  }, [isOpen, isPendingTransaction, handleClaim])

  const buttonConfig = useLpIncentiveClaimButtonConfig({
    isLoading: isPending,
    isPendingTransaction,
    onClaim: () => handleClaim(), // Don't skip analytics for manual claim
  })

  return (
    <Dialog
      isOpen={isOpen}
      icon={
        iconUrl ? (
          <Image src={iconUrl} width={iconSizes.icon48} height={iconSizes.icon48} objectFit="cover" />
        ) : undefined
      }
      title={t('pool.incentives.collectingRewards')}
      subtext={
        <Flex gap="$spacing4">
          <Flex row alignItems="center" justifyContent="center" gap="$spacing4">
            <Text variant="body2">{`${formattedTokenRewards} ${token.symbol}`}</Text>
          </Flex>
          {error && (
            <Flex mt="$spacing6">
              <InlineWarningCard
                severity={WarningSeverity.Medium}
                description={t('pool.incentives.collectFailed')}
                hideCtaIcon
              />
            </Flex>
          )}
        </Flex>
      }
      displayHelpCTA
      onClose={onClose}
      primaryButtonOnPress={buttonConfig.onClick}
      isPrimaryButtonLoading={buttonConfig.isLoading}
      modalName={ModalName.LpIncentiveClaimModal}
      primaryButtonText={buttonConfig.title}
    />
  )
}
