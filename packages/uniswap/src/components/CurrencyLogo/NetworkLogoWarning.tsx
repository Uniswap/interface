import { memo } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { RoundExclamation } from 'ui/src/components/icons/RoundExclamation'
import { iconSizes, spacing, zIndexes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

interface NetworkLogoWarningProps {
  chainId: UniverseChainId
  hasSufficientFunds: boolean
}

export const NetworkLogoWarning = memo(function _NetworkLogoWarning({
  hasSufficientFunds,
  chainId,
}: NetworkLogoWarningProps): JSX.Element {
  const colors = useSporeColors()

  return (
    <Flex centered height={iconSizes.icon40} width={iconSizes.icon24} py="$spacing8">
      <Flex centered height={iconSizes.icon24} testID={TestID.TokenLogo} pointerEvents="auto" position="relative">
        <Flex opacity={hasSufficientFunds ? 1 : 0.5} borderRadius="$rounded8" backgroundColor={colors.white.val}>
          <NetworkLogo chainId={chainId} size={iconSizes.icon24} />
        </Flex>
        {!hasSufficientFunds && (
          <Flex bottom={-5} position="absolute" right={-5} zIndex={zIndexes.mask}>
            <Flex
              borderRadius="$roundedFull"
              borderWidth={1}
              borderColor="$surface1"
              alignItems="center"
              justifyContent="center"
              width={iconSizes.icon12 + spacing.spacing2}
              height={iconSizes.icon12 + spacing.spacing2}
            >
              <RoundExclamation size={iconSizes.icon12} />
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
})
