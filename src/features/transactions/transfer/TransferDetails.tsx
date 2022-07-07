import React from 'react'
import { useTranslation } from 'react-i18next'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'

export function TransferDetails() {
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddressWithThrow()

  return (
    <Flex bg="translucentBackground" borderRadius="lg" gap="xxxs">
      <Flex gap="sm" p="md">
        <Flex row gap="sm" justifyContent="space-between">
          <Text color="textPrimary" variant="bodySmall">
            {t('Network fee')}
          </Text>
          <Box>
            <Text color="textSecondary" variant="bodySmall">
              Fast • <Text variant="bodySmall">$420.69</Text>
            </Text>
          </Box>
        </Flex>
      </Flex>
      <Separator />
      <Flex row shrink gap="sm" justifyContent="space-between" p="sm">
        <AddressDisplay
          address={activeAddress}
          showNotificationBadge={false}
          size={20}
          variant="bodySmall"
          verticalGap="none"
        />
        <Flex centered row shrink gap="xs">
          <Text color="textSecondary" variant="bodySmall">
            {shortenAddress(activeAddress)}
          </Text>
        </Flex>
      </Flex>
      <Box />
    </Flex>
  )
}
