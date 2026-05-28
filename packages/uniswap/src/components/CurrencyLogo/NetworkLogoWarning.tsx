import { memo } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { RoundExclamation } from 'ui/src/components/icons/RoundExclamation'
import { borderRadii, iconSizes, zIndexes } from 'ui/src/theme'
import { STATUS_RATIO } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const size = iconSizes.icon40
const networkLogoSize = Math.round(size * STATUS_RATIO)

const imageStyle = {
  width: iconSizes.icon20,
  height: iconSizes.icon20,
  borderRadius: borderRadii.roundedFull,
}

interface NetworkLogoWarningProps {
  chainId: UniverseChainId
}

export const NetworkLogoWarning = memo(function _NetworkLogoWarning({ chainId }: NetworkLogoWarningProps): JSX.Element {
  const colors = useSporeColors()

  return (
    <Flex centered height={size} width={size}>
      <Flex centered height={size} testID={TestID.TokenLogo} pointerEvents="auto" width={size} position="relative">
        <Flex opacity={0.5} borderRadius="$rounded8" backgroundColor={colors.white.val}>
          <NetworkLogo chainId={chainId} size={iconSizes.icon28} />
        </Flex>
        <Flex bottom={-2} position="absolute" right={-3} zIndex={zIndexes.mask}>
          <Flex
            backgroundColor="$surface1"
            borderRadius="$roundedFull"
            alignItems="center"
            justifyContent="center"
            style={{
              ...imageStyle,
            }}
          >
            <RoundExclamation size={networkLogoSize} />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
})
