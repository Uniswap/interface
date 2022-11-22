import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Flex } from 'src/components/layout'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'

interface TokenDetailsHeaderProps {
  currency: Currency
}

export function TokenDetailsBackButtonRow({ currency }: TokenDetailsHeaderProps) {
  return (
    <>
      <Flex row alignItems="center" justifyContent="space-between" pt="sm" px="md">
        <BackButton />
        <TokenDetailsFavoriteButton currency={currency} />
      </Flex>
    </>
  )
}
