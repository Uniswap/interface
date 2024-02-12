import React from 'react'
import { Unicon } from 'src/components/unicons/Unicon'
import { Flex, Separator, Text, useSporeColors } from 'ui/src'
import Check from 'ui/src/assets/icons/check.svg'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'

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
          <Text
            color="$neutral1"
            numberOfLines={1}
            testID={`address-display/name/${displayName?.name}`}
            variant="body1">
            {displayName?.name}
          </Text>
          <Text color="$neutral2" variant="subheading2">
            {shortenAddress(account.address)}
          </Text>
        </Flex>
        <Flex height={ICON_SIZE} width={ICON_SIZE}>
          {activeAccount?.address === account.address && (
            <Check color={colors.accent1.get()} height={ICON_SIZE} width={ICON_SIZE} />
          )}
        </Flex>
      </Flex>
    </>
  )
}
