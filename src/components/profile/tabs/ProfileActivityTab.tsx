import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex } from 'src/components/layout'
import { TabViewScrollProps } from 'src/components/layout/screens/TabbedScrollScreen'
import { Text } from 'src/components/Text'
import TransactionList from 'src/components/TransactionList/TransactionList'
import { TransactionDetails } from 'src/features/transactions/types'

export default function ProfileActivityTab({
  transactions,
  tabViewScrollProps,
}: {
  transactions: TransactionDetails[]
  tabViewScrollProps: TabViewScrollProps
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
        readonly={true}
        tabViewScrollProps={tabViewScrollProps}
        transactions={transactions}
      />
    </Box>
  )
}
