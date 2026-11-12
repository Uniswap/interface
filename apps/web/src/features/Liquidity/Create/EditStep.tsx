import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { UniverseChainId } from '@universe/chains'
import { Button, Flex, iconSizes, Text } from '@universe/mycelium'
import { Edit } from '@universe/mycelium/icons/Edit'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getPoolName } from 'uniswap/src/features/pools/names'
import { orderPoolDataByQuoteToken } from 'uniswap/src/features/pools/quoteToken'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import type { PoolData } from '~/data/pools/poolData'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { CreatingPoolInfo } from '~/features/Liquidity/Create/CreatingPoolInfo'
import { useDefaultInitialPrice } from '~/features/Liquidity/Create/hooks/useDefaultInitialPrice'
import { usePoolDisplayCurrencies } from '~/features/Liquidity/Create/hooks/usePoolDisplayCurrencies'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { DisplayCurrentPrice } from '~/features/Liquidity/DisplayCurrentPrice'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'
import { ExpandablePoolInfo } from '~/features/Liquidity/PoolInfoCard/PoolInfoCard'
import { PositionField } from '~/types/position'

export const EditSelectTokensStep = ({ poolData, token0IsQuote }: { poolData?: PoolData; token0IsQuote?: boolean }) => {
  const { t } = useTranslation()
  const {
    setStep,
    protocolVersion,
    creatingPoolOrPair,
    positionState,
    selectedFeeBreakdown: feeBreakdown,
    resetDeposit: resetDepositState,
    resetPriceRange: resetPriceRangeState,
  } = useCreateLiquidityContext()

  const { fee, hook } = positionState
  const media = useMedia()

  const handleEdit = useCallback(() => {
    resetPriceRangeState()
    resetDepositState()
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [resetDepositState, resetPriceRangeState, setStep])

  // Both layouts present the pool, not the deposit, so neither follows the "Add as ETH" toggle.
  const poolCurrencies = usePoolDisplayCurrencies()
  const { TOKEN0, TOKEN1 } = poolCurrencies
  const chainId = (TOKEN0?.chainId ?? TOKEN1?.chainId) as UniverseChainId | undefined
  const [baseCurrency, quoteCurrency] = orderPoolDataByQuoteToken({ token0IsQuote, data0: TOKEN0, data1: TOKEN1 })
  const { price: defaultInitialPrice } = useDefaultInitialPrice({
    currencies: {
      [PositionField.TOKEN0]: TOKEN0,
      [PositionField.TOKEN1]: TOKEN1,
    },
    skip: creatingPoolOrPair,
  })

  if (poolData && media.xl) {
    return (
      <ExpandablePoolInfo
        currency0={TOKEN0}
        currency1={TOKEN1}
        baseCurrency={baseCurrency}
        quoteCurrency={quoteCurrency}
        version={protocolVersion}
        v4hook={hook}
        feeTier={fee}
        poolData={poolData}
      />
    )
  }

  const poolName = getPoolName({ symbol0: baseCurrency?.symbol, symbol1: quoteCurrency?.symbol, spaced: true })

  return (
    <Flex gap="$gap12">
      <Flex row gap="$gap12" alignItems="center">
        <DoubleCurrencyLogo
          currencies={[baseCurrency ?? undefined, quoteCurrency ?? undefined]}
          size={media.md ? iconSizes.icon44 : iconSizes.icon32}
        />
        <Flex row grow gap="$gap12" $md={{ flexDirection: 'column', gap: '$gap4' }}>
          <Text variant="subheading1" testID={TestID.PoolPairLabel}>
            {poolName}
          </Text>
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
