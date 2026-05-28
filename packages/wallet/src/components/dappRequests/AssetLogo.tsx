import { Flex, Loader, UniversalImage, useSporeColors } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const DAPP_REQUEST_LOGO_SIZE = 36

const IMAGE_SIZE = { height: DAPP_REQUEST_LOGO_SIZE, width: DAPP_REQUEST_LOGO_SIZE }

interface AssetLogoProps {
  address: string
  chainId: UniverseChainId
  logoUrl?: string
  borderRadius: number
}

/**
 * Displays an asset logo with consistent styling and fallback behavior
 * Uses CurrencyLogo when currency info is available, falls back to logoUrl image
 * Used across transaction sections for sending, receiving, and approving assets
 */
export function AssetLogo({ address, chainId, logoUrl, borderRadius }: AssetLogoProps): JSX.Element | null {
  const colors = useSporeColors()
  const currencyId = buildCurrencyId(chainId, address)
  const { currencyInfo, loading } = useCurrencyInfoWithLoading(currencyId)

  // Use CurrencyLogo if we have currency info
  if (currencyInfo) {
    return <CurrencyLogo currencyInfo={currencyInfo} size={DAPP_REQUEST_LOGO_SIZE} />
  }

  // Show loading state while fetching currency info
  if (loading) {
    return <Loader.Box borderRadius={borderRadius} height={DAPP_REQUEST_LOGO_SIZE} width={DAPP_REQUEST_LOGO_SIZE} />
  }

  return logoUrl ? (
    <Flex width={DAPP_REQUEST_LOGO_SIZE} height={DAPP_REQUEST_LOGO_SIZE}>
      <UniversalImage
        fallback={
          <Flex
            borderRadius={borderRadius}
            height={DAPP_REQUEST_LOGO_SIZE}
            style={{ backgroundColor: colors.surface3.val }}
            width={DAPP_REQUEST_LOGO_SIZE}
          />
        }
        size={IMAGE_SIZE}
        style={{
          image: { borderRadius },
          loadingContainer: {
            borderRadius,
            overflow: 'hidden' as const,
          },
        }}
        uri={logoUrl}
      />
    </Flex>
  ) : null
}
