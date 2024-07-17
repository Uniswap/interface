import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import {
  ApproveSendTransactionRequest,
  DappRequest as DappRequestBaseType,
  DappRequestType,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { TransactionType, TransactionTypeInfo } from 'wallet/src/features/transactions/types'

function useDappRequestTokenRecipientInfo(request: DappRequestBaseType, dappUrl: string): Maybe<CurrencyInfo> {
  const activeChain = useDappLastChainId(dappUrl)
  const type = request.type
  const to = type === DappRequestType.SendTransaction ? request.transaction.to : undefined

  const identifier =
    activeChain && type === DappRequestType.SendTransaction && to ? buildCurrencyId(activeChain, to) : undefined

  return useCurrencyInfo(identifier)
}

function parseSpenderAddress(data: string): string {
  // Check if the data is of the correct length for "approve(address,uint256)"
  // It should have 10 characters for "0x" + function selector and 64 characters for each parameter
  if (data.length !== 10 + 64 * 2) {
    throw new Error('Invalid data length')
  }

  // The first argument (address) starts 10 characters in (after "0x" + 8 characters for function selector)
  // and spans the next 64 characters, but the first 24 are padding zeros for the 40-character address
  const addressHex = data.slice(34, 74) // From position 34 to 74 to capture the address

  // Validate if the address hex is correctly formatted
  if (!/^[0-9a-fA-F]{40}$/.test(addressHex)) {
    throw new Error('Invalid characters in hex string')
  }

  return `0x${addressHex}`
}

interface ApproveRequestContentProps {
  transactionGasFeeResult: GasFeeResult
  dappRequest: ApproveSendTransactionRequest
  onCancel: () => Promise<void>
  onConfirm: (transactionTypeInfo?: TransactionTypeInfo) => Promise<void>
}

export function ApproveRequestContent({
  dappRequest,
  transactionGasFeeResult,
  onCancel,
  onConfirm,
}: ApproveRequestContentProps): JSX.Element {
  const { t } = useTranslation()
  const { dappUrl } = useDappRequestQueueContext()

  const tokenInfo = useDappRequestTokenRecipientInfo(dappRequest, dappUrl)
  const tokenSymbol = tokenInfo?.currency.symbol
  const spender = parseSpenderAddress(dappRequest.transaction.data)
  const transactionTypeInfo: TransactionTypeInfo | undefined = dappRequest.transaction.to
    ? {
        type: TransactionType.Approve,
        tokenAddress: dappRequest.transaction.to,
        spender,
      }
    : undefined
  const onConfirmWithTransactionTypeInfo = (): Promise<void> => onConfirm(transactionTypeInfo)

  return (
    <DappRequestContent
      showNetworkCost
      confirmText={t('dapp.request.approve.action')}
      headerIcon={<CurrencyLogo hideNetworkLogo currencyInfo={tokenInfo} size={iconSizes.icon40} />}
      title={tokenSymbol ? t('dapp.request.approve.title', { tokenSymbol }) : t('dapp.request.approve.fallbackTitle')}
      transactionGasFeeResult={transactionGasFeeResult}
      onCancel={onCancel}
      onConfirm={onConfirmWithTransactionTypeInfo}
    >
      <Flex
        backgroundColor="$surface2"
        borderColor="$surface3"
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        gap="$spacing4"
        p="$spacing12"
      >
        <Text color="$neutral2" variant="body4">
          {t('dapp.request.approve.helptext')}
        </Text>
        <LearnMoreLink textVariant="body4" url={uniswapUrls.helpArticleUrls.approvalsExplainer} />
      </Flex>
    </DappRequestContent>
  )
}
