import { BigNumber } from '@ethersproject/bignumber'
import { IntegrationError } from 'lib/errors'
import { FeeOptions } from 'lib/hooks/swap/useSyncConvenienceFee'
import { DefaultAddress, TokenDefaults } from 'lib/hooks/swap/useSyncTokenDefaults'
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

type ValidatorProps = PropsWithChildren<TokenDefaults & FeeOptions>

export default function SwapPropValidator(props: ValidatorProps) {
  const { convenienceFee, convenienceFeeRecipient } = props
  useEffect(() => {
    if (convenienceFee) {
      if (convenienceFee > 100 || convenienceFee < 0) {
        throw new IntegrationError(`convenienceFee must be between 0 and 100. (You set it to ${convenienceFee})`)
      }
      if (!convenienceFeeRecipient) {
        throw new IntegrationError('convenienceFeeRecipient is required when convenienceFee is set.')
      }

      if (typeof convenienceFeeRecipient === 'string') {
        if (!isAddress(convenienceFeeRecipient)) {
          throw new IntegrationError(
            `convenienceFeeRecipient must be a valid address. (You set it to ${convenienceFeeRecipient}.)`
          )
        }
      } else if (typeof convenienceFeeRecipient === 'object') {
        Object.values(convenienceFeeRecipient).forEach((recipient) => {
          if (!isAddress(recipient)) {
            const values = Object.values(convenienceFeeRecipient).join(', ')
            throw new IntegrationError(
              `All values in convenienceFeeRecipient object must be valid addresses. (You used ${values}.)`
            )
          }
        })
      }
    }
  }, [convenienceFee, convenienceFeeRecipient])

  const { defaultInputTokenAddress, defaultInputAmount, defaultOutputTokenAddress, defaultOutputAmount } = props
  useEffect(() => {
    if (defaultOutputAmount && defaultInputAmount) {
      throw new IntegrationError('defaultInputAmount and defaultOutputAmount may not both be defined.')
    }
    if (defaultInputAmount && BigNumber.from(defaultInputAmount).lt(0)) {
      throw new IntegrationError(`defaultInputAmount must be a positive number. (You set it to ${defaultInputAmount})`)
    }
    if (defaultOutputAmount && BigNumber.from(defaultOutputAmount).lt(0)) {
      throw new IntegrationError(
        `defaultOutputAmount must be a positive number. (You set it to ${defaultOutputAmount})`
      )
    }
    if (
      defaultInputTokenAddress &&
      !isAddressOrAddressMap(defaultInputTokenAddress) &&
      defaultInputTokenAddress !== 'NATIVE'
    ) {
      throw new IntegrationError(
        `defaultInputTokenAddress(es) must be a valid address or "NATIVE". (You set it to ${defaultInputTokenAddress}`
      )
    }
    if (
      defaultOutputTokenAddress &&
      !isAddressOrAddressMap(defaultOutputTokenAddress) &&
      defaultOutputTokenAddress !== 'NATIVE'
    ) {
      throw new IntegrationError(
        `defaultOutputTokenAddress(es) must be a valid address or "NATIVE". (You set it to ${defaultOutputTokenAddress}`
      )
    }
  }, [defaultInputTokenAddress, defaultInputAmount, defaultOutputTokenAddress, defaultOutputAmount])

  return null
}
