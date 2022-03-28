import React, { PropsWithChildren, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { useAccountStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { ElementName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

type AccountHeaderProps = PropsWithChildren<{
  onPress?: () => void
  chevronDirection?: 'n' | 's'
}>

export function AccountHeader({ children, onPress, chevronDirection }: AccountHeaderProps) {
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
  const theme = useAppTheme()

  return (
    <Box alignItems="center" flexDirection="row" justifyContent="space-between">
      <Button
        alignItems="center"
        flexDirection="row"
        name={ElementName.Manage}
        testID={ElementName.Manage}
        onPress={onPressAccount}>
        <Flex centered flexDirection="row" gap="xs">
          <AddressDisplay
            address={activeAccount?.address}
            fallback={t('Connect Wallet')}
            variant="buttonLabel"
          />
          <Chevron
            color={theme.colors.gray400}
            direction={chevronDirection ?? 's'}
            height="9"
            width="18"
          />
        </Flex>
      </Button>
      <Box alignItems="center" flexDirection="row" justifyContent="flex-end">
        {children}
      </Box>
    </Box>
  )
}
