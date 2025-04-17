import { Token } from '@uniswap/sdk-core'
import { DialogV2 } from 'components/Dialog/DialogV2'
import { useFormattedTokenRewards } from 'components/Liquidity/hooks/LpIncentiveClaim/useFormattedTokenRewards'
import { useLpIncentiveClaimButtonConfig } from 'components/Liquidity/hooks/LpIncentiveClaim/useLpIncentiveClaimButtonConfig'
import { useLpIncentiveClaimMutation } from 'components/Liquidity/hooks/LpIncentiveClaim/useLpIncentiveClaimMutation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Image, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { UNI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
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
  token = UNI[UniverseChainId.Mainnet],
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

      // TODO | LP_INCENTIVES - do we need to surface this error in datadog?
      setError(t('pool.incentives.collectFailed'))
    },
  })

  const handleClaim = useEvent(() => {
    sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsRetry)
    setError(null)
    claim()
  })

  // Only auto-claim when the modal opens and there's no pending transaction
  useEffect(() => {
    if (isOpen && !isPendingTransaction) {
      handleClaim()
    }
  }, [isOpen, isPendingTransaction, handleClaim])

  const buttonConfig = useLpIncentiveClaimButtonConfig({
    isLoading: isPending,
    isPendingTransaction,
    onClaim: handleClaim,
  })

  return (
    <DialogV2
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
      primaryButtonOnClick={buttonConfig.onClick}
      isPrimaryButtonLoading={buttonConfig.isLoading}
      modalName={ModalName.LpIncentiveClaimModal}
      primaryButtonText={buttonConfig.title}
    />
  )
}
