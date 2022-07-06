import React, { PropsWithChildren } from 'react'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { ElementName } from 'src/features/telemetry/constants'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'

type AccountHeaderProps = PropsWithChildren<{
  onPress: () => void
}>

export function AccountHeader({ children, onPress }: AccountHeaderProps) {
  const activeAddress = useAppSelector(selectActiveAccountAddress)
  const theme = useAppTheme()
  return (
    <>
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
          {activeAddress && (
            <Flex row gap="xs">
              <AddressDisplay address={activeAddress} variant="mediumLabel" />
              <Chevron color={theme.colors.textSecondary} direction="s" />
            </Flex>
          )}
        </Button>
        <Box alignItems="center" flexDirection="row" justifyContent="flex-end">
          {children}
        </Box>
      </Box>
    </>
  )
}
