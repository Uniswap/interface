import { memo } from 'react'
import { Flex } from 'ui/src'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const BANNER_SIZE = iconSizes.icon32
const LOGO_SIZES = {
  single: iconSizes.icon24,
  singleInner: iconSizes.icon20,
  multi: iconSizes.icon20,
  multiInner: iconSizes.icon16,
} as const

const LOGO_STYLES = {
  single: { width: LOGO_SIZES.single, height: LOGO_SIZES.single },
  multi: { width: LOGO_SIZES.multi, height: LOGO_SIZES.multi },
} as const

const MAX_LOGOS = 4

interface ExcludedNetworkLogosProps {
  chainIds?: UniverseChainId[]
}

type BorderRadiusType = '$rounded6' | '$rounded8'
type StyleType = typeof LOGO_STYLES.single | typeof LOGO_STYLES.multi

// Adds a solid background layer to prevent visibility through the logo
// due to the semi-transparent $statusCritical2 background color.
const BackgroundMask = ({ borderRadius, style }: { borderRadius: BorderRadiusType; style: StyleType }): JSX.Element => (
  <Flex backgroundColor="$surface1" borderRadius={borderRadius} style={style} position="absolute" />
)

const SingleLogo = ({ chainId }: { chainId: UniverseChainId }): JSX.Element => (
  <Flex centered borderRadius="$rounded8" style={LOGO_STYLES.single}>
    <NetworkLogo chainId={chainId} size={LOGO_SIZES.single} />
  </Flex>
)

const TwoLogos = ({ chainIds }: { chainIds: [UniverseChainId, UniverseChainId] }): JSX.Element => (
  <>
    <Flex position="absolute" top={0} left={0} zIndex={zIndexes.mask}>
      <Flex centered borderRadius="$rounded8" style={LOGO_STYLES.single}>
        <NetworkLogo chainId={chainIds[0]} size={LOGO_SIZES.singleInner} />
      </Flex>
    </Flex>
    <Flex position="absolute" bottom={1} right={1} zIndex={zIndexes.mask + 1}>
      <BackgroundMask borderRadius="$rounded8" style={LOGO_STYLES.single} />
      <Flex backgroundColor="$statusCritical2" borderRadius="$rounded8" style={LOGO_STYLES.single}>
        <Flex centered style={LOGO_STYLES.single}>
          <NetworkLogo chainId={chainIds[1]} size={LOGO_SIZES.singleInner} />
        </Flex>
      </Flex>
    </Flex>
  </>
)

const MultiLogo = ({
  chainId,
  position,
}: {
  chainId: UniverseChainId
  position?: { top?: number; bottom?: number; left?: number; right?: number }
}): JSX.Element => (
  <Flex position="absolute" zIndex={zIndexes.mask} {...position}>
    <BackgroundMask borderRadius="$rounded6" style={LOGO_STYLES.multi} />
    <Flex centered backgroundColor="$statusCritical2" borderRadius="$rounded6" style={LOGO_STYLES.multi}>
      <NetworkLogo chainId={chainId} size={LOGO_SIZES.multiInner} />
    </Flex>
  </Flex>
)

const ThreeLogos = ({ chainIds }: { chainIds: [UniverseChainId, UniverseChainId, UniverseChainId] }): JSX.Element => (
  <>
    <MultiLogo chainId={chainIds[0]} position={{ top: -1, left: -1 }} />
    <MultiLogo chainId={chainIds[2]} position={{ bottom: -1, right: -1 }} />
    <MultiLogo chainId={chainIds[1]} />
  </>
)

const FourLogos = ({
  chainIds,
}: {
  chainIds: [UniverseChainId, UniverseChainId, UniverseChainId, UniverseChainId]
}): JSX.Element => (
  <>
    <MultiLogo chainId={chainIds[0]} position={{ top: -1, left: -1 }} />
    <MultiLogo chainId={chainIds[1]} position={{ bottom: -1, left: -1 }} />
    <MultiLogo chainId={chainIds[2]} position={{ bottom: -1, right: -1 }} />
    <MultiLogo chainId={chainIds[3]} position={{ top: -1, right: -1 }} />
  </>
)

export const ExcludedNetworkLogos = memo(function ExcludedNetworkLogos({
  chainIds = [],
}: ExcludedNetworkLogosProps): JSX.Element {
  const renderLogos = (): JSX.Element | null => {
    const logoCount = Math.min(chainIds.length, MAX_LOGOS) as 1 | 2 | 3 | 4

    if (!chainIds.length) {
      return null
    }

    const logoComponents: { [key in 1 | 2 | 3 | 4]: JSX.Element | null } = {
      1: chainIds[0] ? <SingleLogo chainId={chainIds[0]} /> : null,
      2:
        chainIds.length >= 2 ? (
          <TwoLogos chainIds={[chainIds[0], chainIds[1]] as [UniverseChainId, UniverseChainId]} />
        ) : null,
      3:
        chainIds.length >= 3 ? (
          <ThreeLogos
            chainIds={[chainIds[0], chainIds[1], chainIds[2]] as [UniverseChainId, UniverseChainId, UniverseChainId]}
          />
        ) : null,
      4:
        chainIds.length >= 4 ? (
          <FourLogos
            chainIds={
              [chainIds[0], chainIds[1], chainIds[2], chainIds[3]] as [
                UniverseChainId,
                UniverseChainId,
                UniverseChainId,
                UniverseChainId,
              ]
            }
          />
        ) : null,
    }

    return logoComponents[logoCount]
  }

  return (
    <Flex centered height={BANNER_SIZE} width={BANNER_SIZE}>
      <Flex
        centered
        height={BANNER_SIZE}
        testID={TestID.ExcludedNetworkBanner}
        pointerEvents="auto"
        width={BANNER_SIZE}
        position="relative"
      >
        {renderLogos()}
      </Flex>
    </Flex>
  )
})
