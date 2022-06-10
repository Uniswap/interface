import React from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogoOnly } from 'src/components/CurrencyLogo'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { EthTransaction } from 'src/features/walletConnect/types'
import { formatUSDPrice } from 'src/utils/format'
import { tryParseRawAmount } from 'src/utils/tryParseAmount'

export function SpendingDetails({
  chainId,
  transaction,
}: {
  chainId: ChainId | undefined
  transaction: EthTransaction
}) {
  const { t } = useTranslation()

  const nativeCurrency = NativeCurrency.onChain(chainId || ChainId.Mainnet)
  const { name, symbol } = nativeCurrency

  const value = transaction.value
  const currencyAmount = tryParseRawAmount(value, nativeCurrency)
  const usdValue = useUSDCValue(currencyAmount)

  if (!currencyAmount || currencyAmount.equalTo(0)) return null

  return (
    <Flex gap="xs">
      <Text color="neutralTextSecondary" fontSize={12}>
        {t('Spending')}
      </Text>
      <Flex row>
        <Flex grow row alignItems="center">
          <CurrencyLogoOnly currency={nativeCurrency} size={32} />
          <Box>
            <Text variant="subHead1">{name}</Text>
            <Text color="neutralTextSecondary" fontSize={12}>
              {symbol}
            </Text>
          </Box>
        </Flex>
        <Box alignItems="flex-end">
          <Text variant="body1">{currencyAmount?.toExact()}</Text>
          <Text color="neutralTextSecondary" fontSize={12}>
            {formatUSDPrice(usdValue?.toExact())}
          </Text>
        </Box>
      </Flex>
    </Flex>
  )
}
