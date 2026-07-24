import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, FlexLoader, Skeleton, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { TokenLogoPair } from 'uniswap/src/components/CurrencyLogo/TokenLogoPair'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getPositionKey } from 'uniswap/src/features/positions/utils'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { logCollectFeesClick } from '~/features/Liquidity/analytics'
import { PortfolioPoolsSidebarCard } from '~/pages/Portfolio/Pools/components/PortfolioPoolsSidebarCard'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'
import { usePendingLPTransactionsChangeListener } from '~/state/transactions/hooks'

const INLINE_ROW_LIMIT = 4
const COLLAPSED_VISIBLE_ROWS = 3

interface PortfolioPoolsFeesPanelProps {
  walletAddress: string | undefined
  chainId: UniverseChainId | undefined
  isExternalWallet?: boolean
  maxHeight?: number
}

export function PortfolioPoolsFeesPanel({
  walletAddress,
  chainId,
  isExternalWallet = false,
  maxHeight,
}: PortfolioPoolsFeesPanelProps): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const [isExpanded, setIsExpanded] = useState(false)

  const { positions, isLoading, isFetchingNextPage, hasNextPage, error, refetch } = useWalletPositions({
    account: walletAddress ?? '',
    chainIds: chainId ? [chainId] : undefined,
    autoFetchAllPages: true,
  })

  usePendingLPTransactionsChangeListener(refetch)

  const isFetchingAllPages = Boolean(walletAddress) && !error && (isLoading || hasNextPage || isFetchingNextPage)

  const eligiblePositions = useMemo(() => {
    return positions
      .filter((position) => position.version !== ProtocolVersion.V2 && (position.uncollectedFeesUsd ?? 0) > 0)
      .sort((a, b) => {
        const diff = (b.uncollectedFeesUsd ?? 0) - (a.uncollectedFeesUsd ?? 0)
        return diff !== 0 ? diff : a.poolId.localeCompare(b.poolId)
      })
  }, [positions])

  const totalUsd = useMemo(
    () => eligiblePositions.reduce((sum, position) => sum + (position.uncollectedFeesUsd ?? 0), 0),
    [eligiblePositions],
  )

  if (!walletAddress || error) {
    return null
  }

  const isEmpty = !isFetchingAllPages && eligiblePositions.length === 0
  const useExpando = eligiblePositions.length > INLINE_ROW_LIMIT
  const visiblePositions = useExpando ? eligiblePositions.slice(0, COLLAPSED_VISIBLE_ROWS) : eligiblePositions
  const hiddenPositions = useExpando ? eligiblePositions.slice(COLLAPSED_VISIBLE_ROWS) : []

  return (
    <Trace section={SectionName.PortfolioPoolsFeesCard}>
      <PortfolioPoolsSidebarCard gap="$gap16" maxHeight={maxHeight} style={{ overflowY: 'auto', overflowX: 'hidden' }}>
        <Flex gap="$gap8">
          <Text variant="body3" color="$neutral2">
            {t('pool.fees.totalEarned')}
          </Text>
          {isFetchingAllPages ? (
            <Skeleton>
              <FlexLoader borderRadius="$rounded12" height={iconSizes.icon24} width={iconSizes.icon100} opacity={0.4} />
            </Skeleton>
          ) : (
            <Flex testID={isEmpty ? TestID.PortfolioPoolsFeesEmpty : TestID.PortfolioPoolsFeesTotal}>
              <AnimatedNumber
                value={convertFiatAmountFormatted(totalUsd, NumberType.FiatTokenQuantity)}
                numericValue={totalUsd}
                textVariant="$heading3"
                color={isEmpty ? '$neutral3' : '$neutral1'}
              />
            </Flex>
          )}
        </Flex>
        {(isFetchingAllPages || eligiblePositions.length > 0) && (
          <Flex gap="$gap8">
            {isFetchingAllPages ? (
              Array.from({ length: COLLAPSED_VISIBLE_ROWS }).map((_, index) => <FeeRowSkeleton key={index} />)
            ) : (
              <>
                {visiblePositions.map((position) => (
                  <FeeRow key={getPositionKey(position)} position={position} showCollectButton={!isExternalWallet} />
                ))}
                {useExpando && (
                  <>
                    <ExpandoRow
                      isExpanded={isExpanded}
                      onPress={() => setIsExpanded((prev) => !prev)}
                      label={t('pool.fees.morePositions', { count: hiddenPositions.length })}
                      color="$neutral2"
                    />
                    {isExpanded &&
                      hiddenPositions.map((position) => (
                        <FeeRow
                          key={getPositionKey(position)}
                          position={position}
                          showCollectButton={!isExternalWallet}
                        />
                      ))}
                  </>
                )}
              </>
            )}
          </Flex>
        )}
      </PortfolioPoolsSidebarCard>
    </Trace>
  )
}

function FeeRowSkeleton(): JSX.Element {
  return (
    <Flex row gap="$gap12" alignItems="center" width="100%">
      <Flex
        width={iconSizes.icon44}
        height={iconSizes.icon28}
        borderRadius="$roundedFull"
        backgroundColor="$surface3"
      />
      <Flex flex={1}>
        <Text variant="body2" loading>
          -
        </Text>
      </Flex>
      <Flex width={iconSizes.icon64} height={iconSizes.icon28} borderRadius="$rounded12" backgroundColor="$surface3" />
    </Flex>
  )
}

function FeeRow({ position, showCollectButton }: { position: PositionInfo; showCollectButton: boolean }): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const dispatch = useAppDispatch()
  const trace = useTrace()

  const [currency0Info, currency1Info] = useCurrencyInfos([
    currencyId(position.currency0Amount.currency),
    currencyId(position.currency1Amount.currency),
  ])

  const handleCollect = useCallback(() => {
    logCollectFeesClick(position, trace)
    dispatch(setOpenModal({ name: ModalName.ClaimFee, initialState: position }))
  }, [dispatch, position, trace])

  return (
    <Flex row gap="$gap12" alignItems="center" width="100%">
      <TokenLogoPair currency0Info={currency0Info} currency1Info={currency1Info} />
      <Flex flex={1} testID={TestID.PortfolioPoolsFeesRow}>
        <AnimatedNumber
          value={convertFiatAmountFormatted(position.uncollectedFeesUsd ?? 0, NumberType.FiatTokenQuantity)}
          numericValue={position.uncollectedFeesUsd ?? 0}
          textVariant="$body2"
        />
      </Flex>
      {showCollectButton && (
        <Button size="xsmall" emphasis="secondary" fill={false} onPress={handleCollect}>
          {t('common.collect.button')}
        </Button>
      )}
    </Flex>
  )
}
