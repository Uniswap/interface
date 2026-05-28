import { BigNumber } from '@ethersproject/bignumber'
import { GasFeeResult } from '@universe/api'
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import {
  ApproveSendTransactionRequest,
  DappRequest as DappRequestBaseType,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { DappRequestType } from 'uniswap/src/features/dappRequests/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionType, TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

function useDappRequestTokenRecipientInfo(request: DappRequestBaseType, dappUrl: string): Maybe<CurrencyInfo> {
  const activeChain = useDappLastChainId(dappUrl)
  const type = request.type
  const to = type === DappRequestType.SendTransaction ? request.transaction.to : undefined

  const identifier =
    activeChain && type === DappRequestType.SendTransaction && to ? buildCurrencyId(activeChain, to) : undefined

  return useCurrencyInfo(identifier)
}

// approve(address,uint256) calldata layout:
// 0x | 8 hex selector | 64 hex address (24 left-pad zeros + 40 hex address) | 64 hex amount
const APPROVE_CALLDATA_LENGTH = 10 + 64 * 2

function parseSpenderAddress(data: string): string | undefined {
  if (data.length !== APPROVE_CALLDATA_LENGTH) {
    return undefined
  }

  const address = `0x${data.slice(34, 74)}`
  return getValidAddress({ address, platform: Platform.EVM }) ?? undefined
}

function isApproveAmountZero(data: string): boolean {
  if (data.length !== APPROVE_CALLDATA_LENGTH) {
    return false
  }
  try {
    // Read the uint256 amount arg: skip "0x" + selector + address arg (74 chars), take the next 64.
    return BigNumber.from(`0x${data.slice(74, 138)}`).isZero()
  } catch {
    return false
  }
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

  // To detect a revoke, both the transaction value and the approve() amount must be zero
  const isRevoke = dappRequest.transaction.value === '0x0' && isApproveAmountZero(dappRequest.transaction.data ?? '')

  const tokenInfo = useDappRequestTokenRecipientInfo(dappRequest, dappUrl)
  const tokenSymbol = tokenInfo?.currency.symbol
  const spender = parseSpenderAddress(dappRequest.transaction.data ?? '')
  const transactionTypeInfo: TransactionTypeInfo | undefined =
    dappRequest.transaction.to && spender
      ? {
          type: TransactionType.Approve,
          tokenAddress: dappRequest.transaction.to,
          spender,
        }
      : undefined
  const onConfirmWithTransactionTypeInfo = (): Promise<void> => onConfirm(transactionTypeInfo)
  const titleCopy = tokenSymbol
    ? isRevoke
      ? t('dapp.request.revoke.title', { tokenSymbol })
      : t('dapp.request.approve.title', { tokenSymbol })
    : t('dapp.request.approve.fallbackTitle')

  return (
    <DappRequestContent
      contentHorizontalPadding="$spacing12"
      showNetworkCost
      confirmText={isRevoke ? t('dapp.request.revoke.action') : t('dapp.request.approve.action')}
      headerIcon={<CurrencyLogo hideNetworkLogo currencyInfo={tokenInfo} size={iconSizes.icon40} />}
      title={titleCopy}
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
          {isRevoke ? t('dapp.request.revoke.helptext') : t('dapp.request.approve.helptext')}
        </Text>
        <LearnMoreLink
          textVariant="body4"
          url={isRevoke ? uniswapUrls.helpArticleUrls.revokeExplainer : uniswapUrls.helpArticleUrls.approvalsExplainer}
        />
      </Flex>
    </DappRequestContent>
  )
}
