import { areAddressesEqual, Platform } from '@universe/chains'
import { usePrice } from '@universe/prices'
import type { AnimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber.web'
import { DEFAULT_NATIVE_ADDRESS, DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/defaults'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isRemotePriceServiceSupportedChain } from 'uniswap/src/features/prices/isRemotePriceServiceSupportedChain'
import { NumberType } from 'utilities/src/format/types'
import { checkIsNative } from '~/hooks/Tokens'
import type { PriceCellValue } from '~/pages/Explore/tables/Tokens/tokenTableTypes'

export function LivePriceCell({
  token,
  textVariant = '$body2',
}: {
  token?: PriceCellValue
  textVariant?: AnimatedNumberProps['textVariant']
}) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const chainId = token?.chainId
  const rawAddress = token?.address
  const isLegacyNative = areAddressesEqual({
    addressInput1: { address: rawAddress, platform: Platform.EVM },
    addressInput2: { address: DEFAULT_NATIVE_ADDRESS_LEGACY, platform: Platform.EVM },
  })
  // unwrapToken brands natives as NATIVE_CHAIN_ID; the price service only accepts the zero address
  const isNative = isLegacyNative || checkIsNative(rawAddress)
  const address = isNative ? DEFAULT_NATIVE_ADDRESS : rawAddress
  const isRemoteSupported = chainId != null && isRemotePriceServiceSupportedChain(chainId)
  const { price: remotePrice } = usePrice({
    chainId: isRemoteSupported ? chainId : undefined,
    address: isRemoteSupported ? address : undefined,
  })

  const price = remotePrice ?? token?.price
  const formatted = price ? convertFiatAmountFormatted(price, NumberType.FiatTokenPrice) : '-'

  return <AnimatedNumber numericValue={price} textVariant={textVariant} value={formatted} />
}
