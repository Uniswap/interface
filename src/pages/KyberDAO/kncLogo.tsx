import { ChainId } from '@kyberswap/ks-sdk-core'

import { KNC_ADDRESS } from 'constants/tokens'
import { getTokenLogoURL } from 'utils'

export default function KNCLogo({ size }: { size?: number }) {
  return (
    <img
      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
      alt="knc-logo"
      width={size ? `${size}px` : '24px'}
      height={size ? `${size}px` : '24px'}
    />
  )
}
