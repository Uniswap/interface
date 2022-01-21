import { BigNumber } from '@ethersproject/bignumber'
import { DefaultAddress } from 'lib/components/Swap'
import { WidgetProps } from 'lib/components/Widget'
import { IntegrationError } from 'lib/errors'
import { useEffect } from 'react'

import { isAddress } from '../../../utils'

function isAddressOrAddressMap(addressOrMap: DefaultAddress): boolean {
  if (typeof addressOrMap === 'object') {
    return Object.values(addressOrMap).every((address) => isAddress(address))
  }
  if (typeof addressOrMap === 'string') {
    return typeof isAddress(addressOrMap) === 'string'
  }
  return false
}

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
    if (defaultInputAmount && BigNumber.from(defaultInputAmount).lt(0)) {
      throw new IntegrationError('defaultInputAmount must be a positive number.')
    }
    if (defaultOutputAmount && BigNumber.from(defaultOutputAmount).lt(0)) {
      throw new IntegrationError('defaultOutputAmount must be a positive number.')
    }
    if (defaultInputAddress && !isAddressOrAddressMap(defaultInputAddress) && defaultInputAddress !== 'NATIVE') {
      throw new IntegrationError('defaultInputAddress must be a valid address.')
    }
    if (defaultOutputAddress && !isAddressOrAddressMap(defaultOutputAddress)) {
      throw new IntegrationError('defaultOutputAddress must be a valid address.')
    }
  }, [defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount])

  return null
}
