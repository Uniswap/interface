import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'
import { resolveCreateNewTokenDisplayImageSrc } from '~/pages/Liquidity/CreateAuction/utils/resolveCreateNewTokenDisplayImageSrc'

interface CreateAuctionTokenLogoProps {
  size: number
  hideNetworkLogo?: boolean
}

/** Renders the logo for the current create-auction token form (new or existing). */
export function CreateAuctionTokenLogo({ size, hideNetworkLogo }: CreateAuctionTokenLogoProps): JSX.Element {
  const tokenForm = useCreateAuctionStore((state) => state.tokenForm)

  if (tokenForm.mode === TokenMode.CREATE_NEW) {
    const url = resolveCreateNewTokenDisplayImageSrc(tokenForm.localImagePreviewUri, tokenForm.imageUrl) ?? null
    return (
      <TokenLogo
        url={url}
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
}
