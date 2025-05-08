import React from 'react'
import { Flex, Separator, Text, Unicon, useSporeColors } from 'ui/src'
import Check from 'ui/src/assets/icons/check.svg'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

type Props = {
  account: Account
  activeAccount: Account | null
}

const ICON_SIZE = 24

export const SwitchAccountOption = ({ account, activeAccount }: Props): JSX.Element => {
  const colors = useSporeColors()
  const displayName = useDisplayName(account.address)

  return (
    <>
      <Separator />
      <Flex row alignItems="center" justifyContent="space-between" px="$spacing24" py="$spacing8">
        <Unicon address={account.address} size={ICON_SIZE} />
        <Flex shrink alignItems="center" p="$none">
          <DisplayNameText
            displayName={displayName}
            textProps={{ variant: 'body1', testID: `address-display/name/${displayName?.name}` }}
          />
          <Text color="$neutral2" variant="subheading2">
            {shortenAddress(account.address)}
          </Text>
        </Flex>
        <Flex height={ICON_SIZE} width={ICON_SIZE}>
          {areAddressesEqual(activeAccount?.address, account.address) && (
            <Check color={colors.accent1.get()} height={ICON_SIZE} width={ICON_SIZE} />
          )}
        </Flex>
      </Flex>
    </>
  )
}
