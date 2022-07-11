import { default as React, useMemo } from 'react'
import { i18n } from 'src/app/i18n'
import { Button } from 'src/components/buttons/Button'
import { CurrencyLogoOrPlaceholder } from 'src/components/CurrencyLogo/CurrencyLogoOrPlaceholder'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { createBalanceUpdate, getCurrencySymbol } from 'src/features/notifications/utils'
import { useCurrency } from 'src/features/tokens/useCurrency'
import {
  TransactionSummaryInfo,
  TXN_HISTORY_ICON_SIZE,
  TXN_HISTORY_SIZING,
} from 'src/features/transactions/SummaryCards/TransactionSummaryItem'
import { TransactionType } from 'src/features/transactions/types'
import { buildCurrencyId } from 'src/utils/currencyId'
import { openUri } from 'src/utils/linking'

const PENDING_ICON_SIZE = 24

export default function PendingSummaryItem({
  transactionSummaryInfo,
}: {
  transactionSummaryInfo: TransactionSummaryInfo
}) {
  const {
    type,
    hash,
    chainId,
    tokenAddress,
    amountRaw,
    assetType,
    status,
    otherTokenAddress,
    nftMetaData,
  } = transactionSummaryInfo

  const currencyId = buildCurrencyId(chainId, tokenAddress ?? '')
  const otherCurrencyId = buildCurrencyId(chainId, otherTokenAddress ?? '')
  const currency = useCurrency(currencyId)
  const otherCurrency = useCurrency(otherCurrencyId)
  const explorerUrl = CHAIN_INFO[ChainId.Mainnet].explorer

  let balanceUpdate = useMemo(() => {
    // Only need a balance update on these 3 types of transactions.
    if (
      amountRaw &&
      (type === TransactionType.Send ||
        type === TransactionType.Receive ||
        type === TransactionType.Swap)
    ) {
      return createBalanceUpdate(type, status, currency, amountRaw)
    }
    return undefined
  }, [amountRaw, currency, status, type])

  const icon =
    type === TransactionType.Swap ? (
      <>
        <Box left={2} position="absolute" testID="swap-success-toast" top={2}>
          <CurrencyLogoOrPlaceholder currency={currency} size={TXN_HISTORY_SIZING.primaryImage} />
        </Box>
        <Box bottom={0} position="absolute" right={0}>
          <CurrencyLogoOrPlaceholder
            currency={otherCurrency}
            size={TXN_HISTORY_SIZING.primaryImage}
          />
        </Box>
      </>
    ) : (
      <LogoWithTxStatus
        assetType={assetType}
        currency={currency}
        nftImageUrl={nftMetaData?.imageURL}
        size={TXN_HISTORY_SIZING}
        txStatus={status}
        txType={type}
      />
    )

  let title = ''
  const tokenAddressOrName = AssetType.Currency ? tokenAddress : nftMetaData?.name ?? 'NFT'
  const assetName = getCurrencySymbol(currency, tokenAddressOrName)

  switch (type) {
    case TransactionType.Swap:
      let tokensText = ''
      if (currency && otherCurrency) {
        tokensText = otherCurrency.symbol + i18n.t(' for ') + assetName
      }
      title = i18n.t('Swap ' + '{{tokensText}}', {
        tokensText,
      })
      break
    case TransactionType.Approve:
      title = i18n.t('Approve {{assetName}}', { assetName })
      break
    case TransactionType.Send:
      title = i18n.t('Sent {{assetName}}', { assetName })
      break
    default:
      title = i18n.t('Unknown transaction')
  }

  return (
    <Button onPress={() => openUri(`${explorerUrl}/tx/${hash}`)}>
      <Flex
        row
        bg="backgroundContainer"
        flexGrow={1}
        gap="xs"
        justifyContent="space-between"
        padding="md">
        <Flex row alignItems="center" flexGrow={1} gap="xs" justifyContent="flex-start">
          <Flex centered height={TXN_HISTORY_ICON_SIZE} width={TXN_HISTORY_ICON_SIZE}>
            {icon}
          </Flex>
          <Flex shrink gap="xxxs">
            <Text adjustsFontSizeToFit fontWeight="500" numberOfLines={2} variant="mediumLabel">
              {title}
            </Text>
            <Text color="textSecondary" variant="badge">
              {balanceUpdate?.assetIncrease}
            </Text>
          </Flex>
        </Flex>
        <Box alignItems="center" flexDirection="row">
          <SpinningLoader size={PENDING_ICON_SIZE} />
        </Box>
      </Flex>
    </Button>
  )
}
