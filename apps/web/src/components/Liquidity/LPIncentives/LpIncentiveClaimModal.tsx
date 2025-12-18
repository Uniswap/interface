import { ClaimLPRewardsRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { Distributor } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Token } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useFormattedTokenRewards } from 'components/Liquidity/LPIncentives/hooks/useFormattedTokenRewards'
import { useLpIncentiveClaimButtonConfig } from 'components/Liquidity/LPIncentives/hooks/useLpIncentiveClaimButtonConfig'
import { LP_INCENTIVES_REWARD_TOKEN } from 'components/LpIncentives/constants'
import { useAccount } from 'hooks/useAccount'
import { useLpIncentivesClaimData } from 'hooks/useLpIncentivesClaimData'
import useSelectChain from 'hooks/useSelectChain'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { lpIncentivesClaimSaga } from 'state/sagas/lp_incentives/lpIncentivesSaga'
import { Flex, Image, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
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
  const isClaimRewardsLiquidityApiEnabled = useFeatureFlag(FeatureFlags.ClaimRewardsLiquidityApi)
  const [error, setError] = useState<string | null>(null)
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const selectChain = useSelectChain()

  const account = useAccount()
  const formattedTokenRewards = useFormattedTokenRewards({ tokenRewards, token })

  const {
    data,
    error: calldataError,
    isLoading: isLoadingClaimData,
  } = useLpIncentivesClaimData({
    isClaimRewardsLiquidityApiEnabled,
    params: isClaimRewardsLiquidityApiEnabled
      ? new ClaimLPRewardsRequest({
          walletAddress: account.address,
          chainId: token.chainId,
          tokens: [token.address],
          distributor: Distributor.MERKLE,
          simulateTransaction: true,
        })
      : {
          walletAddress: account.address,
          chainId: token.chainId,
          tokens: [token.address],
          distributor: TradingApi.Distributor.MERKL,
          simulateTransaction: true,
        },
  })

  useEffect(() => {
    if (calldataError) {
      sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsErrorThrown, {
        error: calldataError.message,
      })
    }
  }, [calldataError])

  const handleClaim = useEvent(({ skipAnalytics = false }: { skipAnalytics?: boolean } = {}) => {
    if (!account.address || !data?.claim) {
      return
    }

    if (!skipAnalytics) {
      sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsRetry)
    }

    setError(null)
    dispatch(
      lpIncentivesClaimSaga.actions.trigger({
        address: account.address,
        chainId: token.chainId,
        claimData: data.claim,
        tokenAddress: token.address,
        selectChain,
        onSuccess,
        onFailure: (error) => {
          setCurrentTransactionStep(undefined)
          // For wallet rejections, we don't need to show an error
          if (didUserReject(error)) {
            return
          }

          logger.error(error, {
            tags: {
              file: 'LpIncentiveClaimModal',
              function: 'render',
            },
          })

          setError(error.message || t('pool.incentives.collectFailed'))
        },
        setCurrentStep: setCurrentTransactionStep,
      }),
    )
  })

  // Only auto-claim when the modal opens, data is loaded, and there's no pending transaction
  useEffect(() => {
    if (isOpen && !isPendingTransaction && !isLoadingClaimData && data) {
      handleClaim({ skipAnalytics: true })
    }
  }, [isOpen, isPendingTransaction, isLoadingClaimData, data, handleClaim])

  const buttonConfig = useLpIncentiveClaimButtonConfig({
    isLoading: Boolean(currentTransactionStep) || isLoadingClaimData,
    isPendingTransaction,
    onClaim: () => handleClaim(), // Don't skip analytics for manual claim
  })

  const primaryButton = useMemo(
    () => ({ text: buttonConfig.title, onPress: buttonConfig.onClick }),
    [buttonConfig.title, buttonConfig.onClick],
  )

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
      primaryButton={primaryButton}
      isPrimaryButtonLoading={buttonConfig.isLoading}
      modalName={ModalName.LpIncentiveClaimModal}
    />
  )
}
