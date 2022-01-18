import { ALL_SUPPORTED_CHAIN_IDS } from 'constants/chains'
import { ChainIdError, IntegrationError } from 'lib/errors'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { SwapWidgetProps } from 'lib/index'
import { useEffect } from 'react'

export default function ErrorGenerator(swapWidgetProps: SwapWidgetProps) {
  const { chainId } = useActiveWeb3React()
  const { jsonRpcEndpoint, provider } = swapWidgetProps
  useEffect(() => {
    if (!provider && !jsonRpcEndpoint) {
      throw new IntegrationError('This widget requires provider or jsonRpcEndpoint prop.')
    }
  }, [provider, jsonRpcEndpoint])

  useEffect(() => {
    if (chainId && !ALL_SUPPORTED_CHAIN_IDS.includes(chainId)) {
      throw new ChainIdError('Please switch to a network supported by the Uniswap Protocol.')
    }
  }, [chainId])

  // size constraints
  const { width } = swapWidgetProps
  useEffect(() => {
    if (width && width < 300) {
      throw new IntegrationError('Please set widget width to at least 300px.')
    }
  }, [width])

  // convenience fee constraints
  const { convenienceFee, convenienceFeeRecipient } = swapWidgetProps
  useEffect(() => {
    if (convenienceFee) {
      if (convenienceFee > 100 || convenienceFee < 0) {
        throw new IntegrationError('Please set widget convenienceFee to at least 400px.')
      }
      if (!convenienceFeeRecipient) {
        throw new IntegrationError('convenienceFeeRecipient is required when convenienceFee is set.')
      }
    }
  }, [convenienceFee, convenienceFeeRecipient])
  return null
}
