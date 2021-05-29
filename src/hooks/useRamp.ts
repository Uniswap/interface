import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk'
import { useCallback } from 'react'
import { useActiveWeb3React } from './index'

export default function useRampWidget() {
  const { account } = useActiveWeb3React()

  return useCallback(() => {
    if (!account) return

    const widget = new RampInstantSDK({
      hostAppName: 'FuseSwap',
      hostLogoUrl: 'https://fuse-brand-assets.s3.eu-central-1.amazonaws.com/fuse.png',
      swapAsset: 'FUSD',
      userAddress: account,
      hostApiKey: process.env.REACT_APP_HOST_API_KEY
    })

    widget.show()
  }, [account])
}
