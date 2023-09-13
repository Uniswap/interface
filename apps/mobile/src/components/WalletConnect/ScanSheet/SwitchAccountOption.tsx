import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { Unicon } from 'src/components/unicons/Unicon'
import { Flex } from 'ui/src'
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
  const theme = useAppTheme()

  const displayName = useDisplayName(account.address)
  return (
    <>
      <Separator />
      <Flex row alignItems="center" justifyContent="space-between" px="$spacing24" py="$spacing8">
        <Unicon address={account.address} size={ICON_SIZE} />
        <Flex shrink alignItems="center" gap="$none" p="$none">
          <Text
            color="neutral1"
            numberOfLines={1}
            testID={`address-display/name/${displayName?.name}`}
            variant="bodyLarge">
            {displayName?.name}
          </Text>
          <Text color="neutral2" variant="subheadSmall">
            {shortenAddress(account.address)}
          </Text>
        </Flex>
        <Flex gap="$none" height={ICON_SIZE} width={ICON_SIZE}>
          {activeAccount?.address === account.address && (
            <Check color={theme.colors.accent1} height={ICON_SIZE} width={ICON_SIZE} />
          )}
        </Flex>
      </Flex>
    </>
  )
}
