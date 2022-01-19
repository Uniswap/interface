import { IntegrationError } from 'lib/errors'
import { SwapWidgetProps } from 'lib/index'
import { useEffect } from 'react'

import { isAddress } from '../../../utils'

export default function ErrorGenerator(swapWidgetProps: SwapWidgetProps) {
  const { jsonRpcEndpoint, provider } = swapWidgetProps
  useEffect(() => {
    if (!provider && !jsonRpcEndpoint) {
      throw new IntegrationError('This widget requires a provider or jsonRpcEndpoint.')
    }
  }, [provider, jsonRpcEndpoint])

  // size constraints
  const { width } = swapWidgetProps
  useEffect(() => {
    if (width && width < 300) {
      throw new IntegrationError('Set widget width to at least 300px.')
    }
  }, [width])

  // convenience fee constraints
  const { convenienceFee, convenienceFeeRecipient } = swapWidgetProps
  useEffect(() => {
    if (convenienceFee) {
      if (convenienceFee > 100 || convenienceFee < 0) {
        throw new IntegrationError('Set widget convenienceFee to at least 400px.')
      }
      if (!convenienceFeeRecipient) {
        throw new IntegrationError('convenienceFeeRecipient is required when convenienceFee is set.')
      }
      const MustBeValidAddressError = new IntegrationError('convenienceFeeRecipient must be a valid address.')
      if (typeof convenienceFeeRecipient === 'string') {
        if (!isAddress(convenienceFeeRecipient)) {
          throw MustBeValidAddressError
        }
      } else if (typeof convenienceFeeRecipient === 'object') {
        Object.values(convenienceFeeRecipient).forEach((recipient) => {
          if (!isAddress(recipient)) {
            throw MustBeValidAddressError
          }
        })
      }
    }
  }, [convenienceFee, convenienceFeeRecipient])
  return null
}
