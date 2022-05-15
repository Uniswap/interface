import React, { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { ElementName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'

type AccountHeaderProps = PropsWithChildren<{
  onPress: () => void
}>

export function AccountHeader({ children, onPress }: AccountHeaderProps) {
  const activeAccount = useActiveAccount()

  const { t } = useTranslation()

  return (
    <Box
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      testID="account-header">
      <Button
        alignItems="center"
        flexDirection="row"
        name={ElementName.Manage}
        testID={ElementName.Manage}
        onPress={onPress}>
        <AddressDisplay
          address={activeAccount?.address}
          fallback={t('Connect Wallet')}
          variant="mediumLabel"
        />
      </Button>
      <Box alignItems="center" flexDirection="row" justifyContent="flex-end">
        {children}
      </Box>
    </Box>
  )
}
