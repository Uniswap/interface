import { WidgetProps } from 'lib/components/Widget'
import { IntegrationError } from 'lib/errors'
import { useEffect } from 'react'

import { isAddress } from '../../../utils'

export default function PropValidator(swapWidgetProps: WidgetProps) {
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

  const { defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount } = swapWidgetProps
  useEffect(() => {
    if (defaultInputAddress && !isAddress(defaultInputAddress)) {
      throw new IntegrationError('defaultInputAddress must be a valid address.')
    }
    if (defaultInputAmount && defaultInputAmount < 0) {
      throw new IntegrationError('defaultInputAmount must be a positive number.')
    }
    if (defaultOutputAddress && !isAddress(defaultOutputAddress)) {
      throw new IntegrationError('defaultOutputAddress must be a valid address.')
    }
    if (defaultOutputAmount && defaultOutputAmount < 0) {
      throw new IntegrationError('defaultOutputAmount must be a positive number.')
    }
  }, [defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount])
  return null
}
