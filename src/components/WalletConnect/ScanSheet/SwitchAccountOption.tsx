import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { Identicon } from 'src/components/accounts/Identicon'
import { Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { Account } from 'src/features/wallet/accounts/types'
import { useDisplayName } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'

type Props = {
  account: Account
  activeAccount: Account | null
}

const ICON_SIZE = 24

export const SwitchAccountOption = ({ account, activeAccount }: Props) => {
  const theme = useAppTheme()

  const displayName = useDisplayName(account.address)
  const nameTypeIsAddress = displayName?.type === 'address'
  return (
    <>
      <Separator />
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        px="lg"
        py={!nameTypeIsAddress ? 'xs' : 'md'}>
        <Identicon address={account.address} size={ICON_SIZE} />
        <Box p="none">
          <Text
            color="neutralTextPrimary"
            testID={`address-display/name/${displayName?.name}`}
            variant="subHead1">
            {displayName?.name}
          </Text>
          {!nameTypeIsAddress && (
            <Text color="neutralTextSecondary" variant="caption">
              {shortenAddress(account.address)}
            </Text>
          )}
        </Box>
        <Box height={ICON_SIZE} width={ICON_SIZE}>
          {activeAccount?.address === account.address && (
            <Check color={theme.colors.neutralTextSecondary} height={ICON_SIZE} width={ICON_SIZE} />
          )}
        </Box>
      </Flex>
    </>
  )
}
