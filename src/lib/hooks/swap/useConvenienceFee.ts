import { Percent } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useAtom } from 'jotai'
import { feeOptionsAtom } from 'lib/state/swap'
import { useCallback, useEffect } from 'react'

interface FeeOptionsArgs {
  convenienceFee?: number
  convenienceFeeRecipient?: string | string | { [chainId: number]: string }
}

export default function useConvenienceFee({ convenienceFee, convenienceFeeRecipient }: FeeOptionsArgs) {
  const { chainId } = useActiveWeb3React()
  const [feeOptions, updateFeeOptions] = useAtom(feeOptionsAtom)

  const setToDefaults = useCallback(() => {
    updateFeeOptions({
      fee: new Percent(0),
      recipient: '',
    })
  }, [updateFeeOptions])

  useEffect(() => {
    if (convenienceFee && convenienceFeeRecipient) {
      if (typeof convenienceFeeRecipient === 'string') {
        updateFeeOptions({
          fee: new Percent(convenienceFee, 10_000),
          recipient: convenienceFeeRecipient,
        })
      } else if (chainId && typeof convenienceFeeRecipient === 'object' && convenienceFeeRecipient[chainId]) {
        updateFeeOptions({
          fee: new Percent(convenienceFee, 10_000),
          recipient: convenienceFeeRecipient[chainId],
        })
      } else {
        setToDefaults()
      }
    } else {
      setToDefaults()
    }
  }, [chainId, convenienceFee, convenienceFeeRecipient, setToDefaults, updateFeeOptions])
  return feeOptions
}
