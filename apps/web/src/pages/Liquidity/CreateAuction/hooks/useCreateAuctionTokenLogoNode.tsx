import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'

interface UseCreateAuctionTokenLogoNodeOptions {
  hideNetworkLogo?: boolean
}

/** Token logo for the current create-auction token form (new or existing). */
export function useCreateAuctionTokenLogoNode(
  size: number,
  options: UseCreateAuctionTokenLogoNodeOptions = {},
): ReactNode {
  const { hideNetworkLogo } = options
  const tokenForm = useCreateAuctionStore((state) => state.tokenForm)

  return useMemo(() => {
    if (tokenForm.mode === TokenMode.CREATE_NEW) {
      return (
        <TokenLogo
          url={tokenForm.imageUrl || null}
          symbol={tokenForm.symbol}
          name={tokenForm.name}
          chainId={tokenForm.network}
          size={size}
          hideNetworkLogo={hideNetworkLogo}
        />
      )
    }
    return (
      <CurrencyLogo
        currencyInfo={tokenForm.existingTokenCurrencyInfo ?? null}
        size={size}
        hideNetworkLogo={hideNetworkLogo}
      />
    )
  }, [hideNetworkLogo, size, tokenForm])
}
