import { BigNumber } from '@ethersproject/bignumber'
import { DefaultAddress } from 'lib/components/Swap'
import { WidgetProps } from 'lib/components/Widget'
import { IntegrationError } from 'lib/errors'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'

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

export default function SwapPropValidator(props: PropsWithChildren<WidgetProps>) {
  // convenience fee constraints
  const [convenienceFeeChecked, setConvenienceFeeChecked] = useState(false)
  const { convenienceFee, convenienceFeeRecipient } = props
  useEffect(() => {
    setConvenienceFeeChecked(false)
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
    setConvenienceFeeChecked(true)
  }, [convenienceFee, convenienceFeeRecipient])

  const [defaultsChecked, setDefaultsChecked] = useState(false)
  const { defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount } = props
  useEffect(() => {
    setDefaultsChecked(false)
    if (defaultOutputAmount && defaultInputAmount) {
      throw new IntegrationError('defaultInputAmount and defaultOutputAmount may not both be defined.')
    }
    // TODO: ensure inputAmounts are valid BigNumbers
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
    setDefaultsChecked(true)
  }, [defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount])

  const propsChecked = useMemo(
    () => convenienceFeeChecked && defaultsChecked && defaultsChecked,
    [convenienceFeeChecked, defaultsChecked]
  )
  if (propsChecked) {
    return <>{props.children}</>
  }
  return null
}
