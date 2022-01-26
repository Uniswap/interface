import { BigNumber } from '@ethersproject/bignumber'
import { DefaultAddress, SwapProps } from 'lib/components/Swap'
import { IntegrationError } from 'lib/errors'
import { PropsWithChildren, useEffect } from 'react'

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

type ValidatorProps = PropsWithChildren<SwapProps>

export default function SwapPropValidator(props: ValidatorProps) {
  // convenience fee constraints
  const { convenienceFee, convenienceFeeRecipient } = props
  useEffect(() => {
    if (convenienceFee) {
      if (convenienceFee > 100 || convenienceFee < 0) {
        throw new IntegrationError('convenienceFee must be between 0 and 100')
      }
      if (!convenienceFeeRecipient) {
        throw new IntegrationError('convenienceFeeRecipient is required when convenienceFee is set.')
      }

      if (typeof convenienceFeeRecipient === 'string') {
        if (!isAddress(convenienceFeeRecipient)) {
          throw new IntegrationError('convenienceFeeRecipient must be a valid address.')
        }
      } else if (typeof convenienceFeeRecipient === 'object') {
        Object.values(convenienceFeeRecipient).forEach((recipient) => {
          if (!isAddress(recipient)) {
            throw new IntegrationError('All values in convenienceFeeRecipient must be valid addresses.')
          }
        })
      }
    }
  }, [convenienceFee, convenienceFeeRecipient])

  const { defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount } = props
  useEffect(() => {
    if (defaultOutputAmount && defaultInputAmount) {
      throw new IntegrationError('defaultInputAmount and defaultOutputAmount may not both be defined.')
    }
    if (defaultInputAmount && BigNumber.from(defaultInputAmount).lt(0)) {
      throw new IntegrationError('defaultInputAmount must be a positive number.')
    }
    if (defaultOutputAmount && BigNumber.from(defaultOutputAmount).lt(0)) {
      throw new IntegrationError('defaultOutputAmount must be a positive number.')
    }
    if (defaultInputAddress && !isAddressOrAddressMap(defaultInputAddress) && defaultInputAddress !== 'NATIVE') {
      throw new IntegrationError('defaultInputAddress(s) must be a valid address or "NATIVE".')
    }
    if (defaultOutputAddress && !isAddressOrAddressMap(defaultOutputAddress) && defaultOutputAddress !== 'NATIVE') {
      throw new IntegrationError('defaultOutputAddress(s) must be a valid address or "NATIVE".')
    }
  }, [defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount])

  return <>{props.children}</>
}
