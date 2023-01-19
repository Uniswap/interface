import React from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Flex } from 'src/components/layout'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'

export function TokenDetailsBackButtonRow({ currencyId }: { currencyId: string }): JSX.Element {
  return (
    <>
      <Flex row alignItems="center" justifyContent="space-between" pt="sm" px="md">
        <BackButton />
        <TokenDetailsFavoriteButton currencyId={currencyId} />
      </Flex>
    </>
  )
}
