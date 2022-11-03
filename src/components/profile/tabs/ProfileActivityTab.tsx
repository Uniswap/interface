import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import TransactionList from 'src/components/TransactionList/TransactionList'

export default function ProfileActivityTab({ ownerAddress }: { ownerAddress: Address }) {
  const { t } = useTranslation()
  return (
    <Box my="xs" px="sm">
      <TransactionList
        emptyStateContent={
          <Flex centered gap="xxl" mt="xl" mx="xl">
            <Text variant="headlineSmall">{t('No activity yet')}</Text>
            <Text color="textSecondary" variant="bodySmall">
              {t(
                'When you make transactions or interact with sites, details of your activity will appear here.'
              )}
            </Text>
          </Flex>
        }
        ownerAddress={ownerAddress}
        readonly={true}
      />
    </Box>
  )
}
