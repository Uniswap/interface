import { useTheme } from '@shopify/restyle'
import React, { PropsWithChildren, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAccountStackNavigation } from 'src/app/navigation/types'
import { Identicon } from 'src/components/accounts/Identicon'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { Theme } from 'src/styles/theme'
import { shortenAddress } from 'src/utils/addresses'

type AccountHeaderProps = PropsWithChildren<{
  onPress?: () => void
  chevronDirection?: 'n' | 's'
}>

export function AccountHeader({ children, onPress, chevronDirection }: AccountHeaderProps) {
  // TODO: get ENS Name
  const activeAccount = useActiveAccount()

  const navigation = useAccountStackNavigation()
  const onPressAccount = useCallback(() => {
    if (onPress) {
      onPress()
    } else {
      navigation.navigate(Screens.AccountStack, { screen: Screens.Accounts })
    }
  }, [onPress, navigation])

  const { t } = useTranslation()
  const theme = useTheme<Theme>()

  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between" mx="sm" my="sm">
      <Button
        flexDirection="row"
        alignItems="center"
        onPress={onPressAccount}
        testID="account_header/manage/button">
        <Flex gap="sm" centered>
          <Identicon address={activeAccount?.address ?? NULL_ADDRESS} size={30} />
          <Text variant="h4">
            {activeAccount ? shortenAddress(activeAccount.address) : t`Connect Wallet`}
          </Text>
          <Chevron
            color={theme.colors.gray200}
            height="9"
            width="18"
            direction={chevronDirection ?? 's'}
          />
        </Flex>
      </Button>
      <Box flexDirection="row" alignItems="center" justifyContent="flex-end">
        {children}
      </Box>
    </Box>
  )
}
