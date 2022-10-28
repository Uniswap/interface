import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Flex } from 'src/components/layout'
import { TokenDetailsContextMenu } from 'src/components/TokenDetails/TokenDetailsContextMenu'

interface TokenDetailsHeaderProps {
  currency: Currency
}

export function TokenDetailsBackButtonRow({ currency }: TokenDetailsHeaderProps) {
  return (
    <>
      <Flex row alignItems="center" justifyContent="space-between" pt="sm" px="sm">
        <BackButton />
        <TokenDetailsContextMenu currency={currency} />
      </Flex>
    </>
  )
}
