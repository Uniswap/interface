import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea, useMedia } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { Edit } from 'ui/src/components/icons/Edit'
import { iconSizes } from 'ui/src/theme'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import type { PoolData } from '~/appGraphql/data/pools/usePoolData'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { CreatingPoolInfo } from '~/features/Liquidity/Create/CreatingPoolInfo'
import { useDefaultInitialPrice } from '~/features/Liquidity/Create/hooks/useDefaultInitialPrice'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { DisplayCurrentPrice } from '~/features/Liquidity/DisplayCurrentPrice'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'
import { PoolStatsContent } from '~/features/Liquidity/PoolInfoCard/PoolInfoCard'
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
    resetDeposit: resetDepositState,
    resetPriceRange: resetPriceRangeState,
  } = useCreateLiquidityContext()

  const { fee, hook } = positionState
  const { TOKEN0, TOKEN1 } = display
  const media = useMedia()
  const isAddLiquidityRevamp = useFeatureFlag(FeatureFlags.AddLiquidityRevamp)
  const [isExpanded, setIsExpanded] = useState(false)
  const [sparklineWidth, setSparklineWidth] = useState(0)

  const isExpandable = !!poolData && media.xl && isAddLiquidityRevamp

  const handleEdit = useCallback(() => {
    resetPriceRangeState()
    resetDepositState()
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [resetDepositState, resetPriceRangeState, setStep])

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const { price: defaultInitialPrice } = useDefaultInitialPrice({
    currencies: {
      [PositionField.TOKEN0]: display.TOKEN0,
      [PositionField.TOKEN1]: display.TOKEN1,
    },
    skip: creatingPoolOrPair,
  })

  return (
    <Flex gap={isExpandable && !isExpanded ? 0 : '$gap12'}>
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
            <LiquidityPositionInfoBadges size="small" version={protocolVersion} v4hook={hook} feeTier={fee} />
          </Flex>
        </Flex>
        {isExpandable ? (
          <Flex flexShrink={0}>
            <TouchableArea onPress={toggleExpand}>
              {isExpanded ? (
                <ChevronsIn size="$icon.20" color="$neutral2" />
              ) : (
                <ChevronsOut size="$icon.20" color="$neutral2" />
              )}
            </TouchableArea>
          </Flex>
        ) : (
          <Flex flexShrink={0}>
            <Button fill={false} emphasis="secondary" size="small" onPress={handleEdit} icon={<Edit size="$icon.20" />}>
              {t('common.edit.button')}
            </Button>
          </Flex>
        )}
      </Flex>

      {isExpandable ? (
        <Flex
          display={isExpanded ? 'flex' : 'none'}
          gap="$spacing24"
          mt="$spacing16"
          onLayout={(e) => setSparklineWidth(e.nativeEvent.layout.width)}
        >
          <PoolStatsContent poolData={poolData} sparklineWidth={sparklineWidth || undefined} />
        </Flex>
      ) : (
        <>
          {creatingPoolOrPair ? (
            <CreatingPoolInfo />
          ) : protocolVersion === ProtocolVersion.V2 ? (
            <DisplayCurrentPrice price={defaultInitialPrice} />
          ) : null}
        </>
      )}
    </Flex>
  )
}
