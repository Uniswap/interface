import type { ReactNode } from 'react'
import { DepositSourceRowContent } from 'src/components/earn/EarnDepositAmountControls'
import { Flex, SpinningLoader, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { EarnBalanceErrorState } from 'uniswap/src/features/earn/EarnBalanceErrorState'

export function EarnDepositLookupState({
  children,
  isError,
  isLoading,
  onRetry,
}: {
  children: ReactNode
  isError: boolean
  isLoading: boolean
  onRetry: () => void
}): JSX.Element {
  if (isError) {
    return (
      <Flex grow justifyContent="center">
        <EarnBalanceErrorState onRetry={onRetry} />
      </Flex>
    )
  }

  if (isLoading) {
    return (
      <Flex grow alignItems="center" justifyContent="center">
        <SpinningLoader color="$accent1" size={iconSizes.icon40} />
      </Flex>
    )
  }

  return <>{children}</>
}

export function EarnProjectedEarningsRow({
  apyLabel,
  hasAmount,
  perYearLabel,
  projectedAnnualEarningsLabel,
}: {
  apyLabel: string
  hasAmount: boolean
  perYearLabel: string
  projectedAnnualEarningsLabel: string
}): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between" px="$spacing16">
      <Text color="$accent1" variant="body3">
        {apyLabel}
      </Text>
      <Text color={hasAmount ? '$statusSuccess' : '$neutral2'} variant="body3">
        {`+${projectedAnnualEarningsLabel} `}
        <Text color="$neutral2" variant="body3">
          {perYearLabel}
        </Text>
      </Text>
    </Flex>
  )
}

export function EarnDepositSourceSection({
  apyLabel,
  availableLabel,
  currencyInfo,
  isWithdrawing,
  lowLiquidityAvailableAmount,
  lowLiquidityTotalAmount,
  showLowLiquidityInfo,
  showSelector,
  onOpenDepositSourceSelector,
}: {
  apyLabel: string
  availableLabel: string
  currencyInfo: CurrencyInfo | undefined
  isWithdrawing: boolean
  lowLiquidityAvailableAmount: string
  lowLiquidityTotalAmount: string
  showLowLiquidityInfo: boolean
  showSelector: boolean
  onOpenDepositSourceSelector: () => void
}): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const row = (
    <DepositSourceRowContent
      apyLabel={apyLabel}
      availableLabel={availableLabel}
      currencyInfo={currencyInfo}
      isWithdrawing={isWithdrawing}
      lowLiquidityAvailableAmount={lowLiquidityAvailableAmount}
      lowLiquidityTotalAmount={lowLiquidityTotalAmount}
      showChevron={showSelector}
      showLowLiquidityInfo={showLowLiquidityInfo}
    />
  )

  if (showSelector) {
    return (
      <TouchableArea
        backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        p="$spacing12"
        shadowColor="$shadowColor"
        shadowOpacity={0.03}
        shadowRadius={4}
        onPress={onOpenDepositSourceSelector}
      >
        {row}
      </TouchableArea>
    )
  }

  return (
    <Flex
      backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      p="$spacing12"
      shadowColor="$shadowColor"
      shadowOpacity={0.03}
      shadowRadius={4}
    >
      {row}
    </Flex>
  )
}

export function EarnWithdrawDestinationSection({
  chainId,
  chainLabel,
  isVisible,
  withdrawToLabel,
  onOpenNetworkSelector,
}: {
  chainId: UniverseChainId
  chainLabel: string
  isVisible: boolean
  withdrawToLabel: string
  onOpenNetworkSelector: (chainId: UniverseChainId) => void
}): JSX.Element | null {
  const isDarkMode = useIsDarkMode()

  if (!isVisible) {
    return null
  }

  return (
    <TouchableArea onPress={() => onOpenNetworkSelector(chainId)}>
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        px="$spacing16"
        py="$spacing12"
      >
        <Text color="$neutral2" variant="body2">
          {withdrawToLabel}
        </Text>
        <Flex row alignItems="center" gap="$spacing6">
          <NetworkLogo chainId={chainId} size={iconSizes.icon20} />
          <Text color="$neutral1" variant="body2">
            {chainLabel}
          </Text>
          <RotatableChevron color="$neutral3" direction="end" size="$icon.16" />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
