import React from 'react'
import { useTranslation } from 'react-i18next'
import { PreloadedQuery } from 'react-relay'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import TransactionList from 'src/components/TransactionList/TransactionList'
import { TransactionListQuery } from 'src/components/TransactionList/__generated__/TransactionListQuery.graphql'

export default function ProfileActivityTab({
  ownerAddress,
  preloadedQuery,
}: {
  ownerAddress: Address
  preloadedQuery: NullUndefined<PreloadedQuery<TransactionListQuery>>
}) {
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
        preloadedQuery={preloadedQuery}
        readonly={true}
      />
    </Box>
  )
}
