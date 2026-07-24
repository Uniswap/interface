import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { InfoRow } from 'uniswap/src/components/activity/details/InfoRow'
import { InfoRowActionButton } from 'uniswap/src/components/activity/details/InfoRowActionButton'
import { getDepositWithdrawDisplayCurrencyId } from 'uniswap/src/features/activity/utils/getDepositWithdrawDisplayCurrencyId'
import { getEarnPlanVaultStep } from 'uniswap/src/features/activity/utils/getEarnPlanDisplayInfo'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  DepositTransactionInfo,
  PlanTransactionInfo,
  TransactionDetails,
  TransactionType,
  WithdrawTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'

export function getVaultTransactionInfoRows({
  transactionDetails,
  typeInfo,
}: {
  transactionDetails: TransactionDetails
  typeInfo: TransactionDetails['typeInfo']
}): [JSX.Element, ...JSX.Element[]] | undefined {
  if (typeInfo.type !== TransactionType.Deposit && typeInfo.type !== TransactionType.Withdraw) {
    return undefined
  }

  if (!typeInfo.isVault) {
    return undefined
  }

  return [
    <EarnVaultRow key="earnVault" chainId={transactionDetails.chainId} typeInfo={typeInfo} />,
    ...(typeInfo.vaultAddress
      ? [<VaultAddressRow key="vaultAddress" chainId={transactionDetails.chainId} address={typeInfo.vaultAddress} />]
      : []),
  ]
}

export function getEarnPlanVaultTransactionInfoRows({
  typeInfo,
}: {
  typeInfo: PlanTransactionInfo
}): [JSX.Element, ...JSX.Element[]] | undefined {
  const vaultStep = getEarnPlanVaultStep(typeInfo)

  return vaultStep
    ? getVaultTransactionInfoRows({
        transactionDetails: vaultStep,
        typeInfo: vaultStep.typeInfo,
      })
    : undefined
}

function EarnVaultRow({
  chainId,
  typeInfo,
}: {
  chainId: TransactionDetails['chainId']
  typeInfo: DepositTransactionInfo | WithdrawTransactionInfo
}): JSX.Element {
  const { t } = useTranslation()
  const currencyInfo = useCurrencyInfo(getDepositWithdrawDisplayCurrencyId({ chainId, typeInfo }))
  const symbol = getSymbolDisplayText(currencyInfo?.currency.symbol)

  return (
    <InfoRow label={typeInfo.type === TransactionType.Deposit ? t('common.text.recipient') : t('common.text.sender')}>
      <Text variant="body3">{symbol ? t('transaction.details.earnVault', { symbol }) : t('explore.earn.title')}</Text>
    </InfoRow>
  )
}

function VaultAddressRow({
  address,
  chainId,
}: {
  address: string
  chainId: TransactionDetails['chainId']
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <InfoRow label={t('transaction.details.vaultAddress')}>
      <InfoRowActionButton
        icon={<ExternalLink color="$neutral3" size="$icon.16" />}
        onPress={async (): Promise<void> => {
          await openUri({
            uri: getExplorerLink({
              chainId,
              data: address,
              type: ExplorerDataType.ADDRESS,
            }),
          })
        }}
      >
        {shortenAddress({ address })}
      </InfoRowActionButton>
    </InfoRow>
  )
}
