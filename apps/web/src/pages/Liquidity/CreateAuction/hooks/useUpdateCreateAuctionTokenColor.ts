import { useEffect, useMemo } from 'react'
import { useSporeColors } from 'ui/src'
import { useSrcColor } from '~/hooks/useColor'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { parseTokenAccentHex } from '~/pages/Liquidity/CreateAuction/tokenAccentHex'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'

/** Passed as `defaultColor` so extraction failures stay distinguishable from real colors. */
const TOKEN_COLOR_EXTRACTION_SENTINEL = '#feedface'

export function useUpdateCreateAuctionTokenColor(): void {
  const colors = useSporeColors()
  const { setTokenColor } = useCreateAuctionStoreActions()
  const tokenForm = useCreateAuctionStore((state) => state.tokenForm)

  const imageUrl = useMemo(() => {
    if (tokenForm.mode === TokenMode.CREATE_NEW) {
      return tokenForm.imageUrl || undefined
    }
    return tokenForm.existingTokenCurrencyInfo?.logoUrl ?? undefined
  }, [tokenForm])

  const currencyName = useMemo(() => {
    if (tokenForm.mode === TokenMode.CREATE_NEW) {
      return tokenForm.name || undefined
    }
    return tokenForm.existingTokenCurrencyInfo?.currency.name ?? undefined
  }, [tokenForm])

  const { tokenColor, tokenColorLoading } = useSrcColor({
    src: imageUrl,
    currencyName,
    backgroundColor: colors.surface3.val,
    defaultColor: TOKEN_COLOR_EXTRACTION_SENTINEL,
  })

  useEffect(() => {
    if (!imageUrl) {
      setTokenColor(undefined)
      return
    }
    if (tokenColorLoading) {
      setTokenColor(undefined)
      return
    }
    // oxlint-disable-next-line universe-custom/no-tolowercase-address-currencyid
    const extractionFailed = tokenColor?.toLowerCase() === TOKEN_COLOR_EXTRACTION_SENTINEL
    setTokenColor(extractionFailed ? undefined : parseTokenAccentHex(tokenColor ?? undefined))
  }, [imageUrl, tokenColor, tokenColorLoading, setTokenColor])
}
