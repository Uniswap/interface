import { TradingApi } from '@universe/api'
import { borderRadii, iconSizes, UniversalImage, UniversalImageResizeMode } from '@universe/mycelium'
import { AcrossLogo } from '@universe/mycelium/logos/AcrossLogo'
import { getBridgeDappInfo, getBridgeProvider } from 'uniswap/src/features/transactions/swap/utils/routing'

/** A bridge vendor's 16px logo: Across's icon, or another vendor's dapp icon. */
export function BridgeProviderLogo({ provider }: { provider: TradingApi.BridgeProvider | undefined }): JSX.Element {
  if (getBridgeProvider(provider) === TradingApi.BridgeProvider.ACROSS) {
    return <AcrossLogo size="$icon.16" />
  }

  return (
    <UniversalImage
      alt=""
      uri={getBridgeDappInfo(provider).icon}
      size={{ width: iconSizes.icon16, height: iconSizes.icon16, resizeMode: UniversalImageResizeMode.Contain }}
      style={{ image: { borderRadius: borderRadii.roundedFull } }}
    />
  )
}
