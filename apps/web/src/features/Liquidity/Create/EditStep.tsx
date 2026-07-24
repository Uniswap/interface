import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useMedia } from 'ui/src'
import { Edit } from 'ui/src/components/icons/Edit'
import { iconSizes } from 'ui/src/theme'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import type { PoolData } from '~/appGraphql/data/pools/usePoolData'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { CreatingPoolInfo } from '~/features/Liquidity/Create/CreatingPoolInfo'
import { useDefaultInitialPrice } from '~/features/Liquidity/Create/hooks/useDefaultInitialPrice'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { DisplayCurrentPrice } from '~/features/Liquidity/DisplayCurrentPrice'
import { useSelectedFeeBreakdown } from '~/features/Liquidity/hooks/useSelectedFeeBreakdown'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'
import { ExpandablePoolInfo } from '~/features/Liquidity/PoolInfoCard/PoolInfoCard'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { PositionField } from '~/types/position'

export const EditSelectTokensStep = ({ poolData }: { poolData?: PoolData }) => {
  const { t } = useTranslation()
  const {
    setStep,
    protocolVersion,
    creatingPoolOrPair,
    currencies: { display },
    positionState,
    protocolFee,
    resetDeposit: resetDepositState,
    resetPriceRange: resetPriceRangeState,
  } = useCreateLiquidityContext()

  const { fee, hook } = positionState
  const { TOKEN0, TOKEN1 } = display
  const chainId = (TOKEN0?.chainId ?? TOKEN1?.chainId) as UniverseChainId | undefined
  const media = useMedia()
  const isAddLiquidityRevamp = useFeatureFlag(FeatureFlags.AddLiquidityRevamp)

  // Same fee-badge tooltip as the review modal / select step: the context's served protocol fee for an
  // existing tier, else the curve for a not-yet-created vanilla v4 pool.
  const feeBreakdown = useSelectedFeeBreakdown({ protocolVersion, fee, servedProtocolFee: protocolFee, hook })

  const handleEdit = useCallback(() => {
    resetPriceRangeState()
    resetDepositState()
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [resetDepositState, resetPriceRangeState, setStep])

  const { price: defaultInitialPrice } = useDefaultInitialPrice({
    currencies: {
      [PositionField.TOKEN0]: display.TOKEN0,
      [PositionField.TOKEN1]: display.TOKEN1,
    },
    skip: creatingPoolOrPair,
  })

  if (poolData && media.xl && isAddLiquidityRevamp) {
    return (
      <ExpandablePoolInfo
        currency0={TOKEN0 ?? undefined}
        currency1={TOKEN1 ?? undefined}
        version={protocolVersion}
        v4hook={hook}
        feeTier={fee}
        poolData={poolData}
      />
    )
  }

  return (
    <Flex gap="$gap12">
      <Flex row gap="$gap12" alignItems="center">
        <DoubleCurrencyLogo
          currencies={[TOKEN0 ?? undefined, TOKEN1 ?? undefined]}
          size={media.md ? iconSizes.icon44 : iconSizes.icon32}
        />
        <Flex row grow gap="$gap12" $md={{ flexDirection: 'column', gap: '$gap4' }}>
          <Flex row gap="$gap8" alignItems="center" testID={TestID.PoolPairLabel}>
            <Text variant="subheading1">{TOKEN0?.symbol}</Text>
            <Text variant="subheading1">/</Text>
            <Text variant="subheading1">{TOKEN1?.symbol}</Text>
          </Flex>
          <Flex row gap={2} alignItems="center">
            <LiquidityPositionInfoBadges
              size="small"
              version={protocolVersion}
              v4hook={hook}
              chainId={chainId}
              feeTier={fee}
              feeBreakdown={feeBreakdown}
            />
          </Flex>
        </Flex>
        <Flex flexShrink={0}>
          <Button fill={false} emphasis="secondary" size="small" onPress={handleEdit} icon={<Edit size="$icon.20" />}>
            {t('common.edit.button')}
          </Button>
        </Flex>
      </Flex>

      {creatingPoolOrPair ? (
        <CreatingPoolInfo />
      ) : protocolVersion === ProtocolVersion.V2 ? (
        <DisplayCurrentPrice price={defaultInitialPrice} />
      ) : null}
    </Flex>
  )
}
