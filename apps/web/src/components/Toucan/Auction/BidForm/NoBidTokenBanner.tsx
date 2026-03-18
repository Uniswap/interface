import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useTokenBalances } from '~/hooks/useTokenBalances'

interface NoBidTokenBannerProps {
  chainId: UniverseChainId
  bidCurrencyAddress: string
  bidTokenSymbol: string
  isNativeBidToken: boolean
  auctionTokenName?: string
}

export function NoBidTokenBanner({
  chainId,
  bidCurrencyAddress,
  bidTokenSymbol,
  isNativeBidToken,
  auctionTokenName,
}: NoBidTokenBannerProps): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const { balanceList } = useTokenBalances({ cacheFirst: true })

  // Find the user's highest-balance token across all chains (excluding the bid token on the auction chain).
  // This supports both same-chain swaps and cross-chain bridges (e.g. USDC on Ethereum → USDC on Base).
  const bestInputToken = useMemo(() => {
    const candidates = balanceList
      .filter((b) => {
        // Skip tokens hidden in the portfolio
        if (b.isHidden) {
          return false
        }
        const currency = b.currencyInfo.currency
        // Exclude the bid token on the auction's chain (that's what the user needs to get)
        if (currency.chainId === chainId) {
          if (isNativeBidToken && currency.isNative) {
            return false
          }
          if (
            !isNativeBidToken &&
            !currency.isNative &&
            currency.address.toLowerCase() === bidCurrencyAddress.toLowerCase()
          ) {
            return false
          }
        }
        return (b.balanceUSD ?? 0) > 0
      })
      .sort((a, b) => (b.balanceUSD ?? 0) - (a.balanceUSD ?? 0))

    if (candidates.length === 0) {
      return undefined
    }

    const topCurrency = candidates[0].currencyInfo.currency
    return {
      address: topCurrency.isNative ? NATIVE_CHAIN_ID : topCurrency.address,
      chainId: topCurrency.chainId as UniverseChainId,
    }
  }, [balanceList, chainId, isNativeBidToken, bidCurrencyAddress])

  const auctionChainName = getChainInfo(chainId).interfaceName
  const auctionChainLabel = getChainInfo(chainId).label

  const handlePress = (): void => {
    const params = new URLSearchParams()

    // Set input chain — defaults to auction chain, or the input token's chain if cross-chain
    const inputChainId = bestInputToken?.chainId ?? chainId
    params.set('chain', getChainInfo(inputChainId).interfaceName)

    // Set output chain if it differs from input (cross-chain bridge)
    if (bestInputToken && bestInputToken.chainId !== chainId) {
      params.set('outputChain', auctionChainName)
    }

    params.set('outputCurrency', isNativeBidToken ? NATIVE_CHAIN_ID : bidCurrencyAddress)
    if (bestInputToken) {
      params.set('inputCurrency', bestInputToken.address)
    }
    params.set('returnTo', location.pathname)
    if (auctionTokenName) {
      params.set('returnToLabel', auctionTokenName)
    }
    navigate(`/swap?${params.toString()}`)
  }

  return (
    <TouchableArea onPress={handlePress}>
      <Flex
        row
        alignItems="center"
        gap="$spacing8"
        px="$spacing16"
        py="$spacing12"
        borderRadius="$rounded16"
        position="relative"
        overflow="hidden"
      >
        {/* Semi-transparent background using token color at 8% opacity */}
        <Flex position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor="$accent1" opacity={0.08} />
        {/* Content */}
        <CoinConvert size="$icon.16" color="$accent1" />
        <Text variant="body3" color="$accent1" flex={1}>
          {t('toucan.bidForm.swapToBid', { tokenSymbol: bidTokenSymbol, chainName: auctionChainLabel })}
        </Text>
        <ArrowRight size="$icon.20" color="$accent1" />
      </Flex>
    </TouchableArea>
  )
}
