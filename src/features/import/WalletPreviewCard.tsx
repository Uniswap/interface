import React from 'react'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'

interface Props {
  address: string
  selected: boolean
  onSelect: (address: string) => void
}

export default function WalletPreviewCard({ address, selected, onSelect }: Props) {
  const chainIds = useActiveChainIds()
  const { balances } = useAllBalancesByChainId(address, chainIds)

  return (
    <Button
      backgroundColor={selected ? 'backgroundContainer' : 'backgroundSurface'}
      borderColor={selected ? 'backgroundAction' : 'none'}
      borderRadius="lg"
      borderWidth={1}
      p="md"
      onPress={() => onSelect(address)}>
      <Flex row alignItems="center" justifyContent="space-between">
        <AddressDisplay address={address} variant="body2" />
        <TotalBalance balances={balances} variant="body2" />
      </Flex>
    </Button>
  )
}
