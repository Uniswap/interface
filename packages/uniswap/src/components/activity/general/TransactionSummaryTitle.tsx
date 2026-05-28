import React from 'react'
import { Flex, Text, UniversalImage, useIsDarkMode } from 'ui/src'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

interface TransactionSummaryTitleProps {
  transaction: TransactionDetails
  title: string
}

const ICON_SIZE = 14

export const TransactionSummaryTitle: React.FC<TransactionSummaryTitleProps> = ({ transaction, title }) => {
  const isDarkMode = useIsDarkMode()
  const onRampLogo =
    transaction.typeInfo.type === TransactionType.OffRampSale ||
    transaction.typeInfo.type === TransactionType.OnRampPurchase ||
    transaction.typeInfo.type === TransactionType.OnRampTransfer ? (
      <UniversalImage
        size={{ height: ICON_SIZE, width: ICON_SIZE }}
        style={{
          image: {
            borderRadius: 4,
          },
        }}
        uri={
          isDarkMode
            ? transaction.typeInfo.serviceProvider.logoDarkUrl
            : transaction.typeInfo.serviceProvider.logoLightUrl
        }
      />
    ) : null

  return (
    <Flex row alignItems="center">
      <Text color="$neutral2" mr={onRampLogo ? 4 : 0} variant="body2">
        {title}
      </Text>
      {onRampLogo}
    </Flex>
  )
}
