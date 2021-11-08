import React, { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'

type AccountHeaderProps = PropsWithChildren<{
  onPressAccounts?: () => void
}>

export function AccountHeader({ children, onPressAccounts }: AccountHeaderProps) {
  // TODO: get ENS Name
  const activeAccount = useActiveAccount()

  const { t } = useTranslation()

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      height={50}
      paddingHorizontal="md"
      marginVertical="md">
      <Button
        flex={1}
        flexDirection="row"
        alignItems="center"
        onPress={() => onPressAccounts?.()}
        testID="account_header/manage/button">
        <Button
          marginRight="sm"
          width={40}
          height={40}
          borderRadius="full"
          backgroundColor="gray100"
        />
        <Text variant="h3" textAlign="left">
          {activeAccount ? shortenAddress(activeAccount.address) : t`Connect Wallet`}
        </Text>
      </Button>
      <Box flexDirection="row">{children}</Box>
    </Box>
  )
}
