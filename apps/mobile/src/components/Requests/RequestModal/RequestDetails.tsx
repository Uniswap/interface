import { BigNumber } from '@ethersproject/bignumber'
import React, { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { PermitInfo } from 'src/components/Requests/RequestModal/ClientDetails'
import {
  isBatchedTransactionRequest,
  isTransactionRequest,
  SignRequest,
  WalletConnectSigningRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text } from 'ui/src'
import { ContentRow } from 'uniswap/src/components/transactions/requests/ContentRow'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { EthTransaction } from 'uniswap/src/types/walletConnect'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { BatchedRequestDetailsContent } from 'wallet/src/components/BatchedTransactions/BatchedTransactionDetails'
import { AddressButton } from 'wallet/src/components/buttons/AddressButton'
import {
  SpendingDetails,
  SpendingEthDetails,
} from 'wallet/src/features/transactions/TransactionRequest/SpendingDetails'
import { useNoYoloParser } from 'wallet/src/utils/useNoYoloParser'
import { useTransactionCurrencies } from 'wallet/src/utils/useTransactionCurrencies'

const MAX_MODAL_MESSAGE_HEIGHT = 200
const MAX_TYPED_DATA_PARSE_DEPTH = 3

const commonCardStyles = {
  backgroundColor: '$surface2' as const,
  borderColor: '$surface3' as const,
  borderRadius: '$rounded16' as const,
  borderWidth: '$spacing1' as const,
}

const requestMessageStyle: StyleProp<ViewStyle> = {
  // need a fixed height here or else modal gets confused about total height
  maxHeight: MAX_MODAL_MESSAGE_HEIGHT,
  overflow: 'hidden',
}

const getStrMessage = (request: WalletConnectSigningRequest): string => {
  if (request.type === EthMethod.PersonalSign || request.type === EthMethod.EthSign) {
    return request.message || request.rawMessage
  }

  return ''
}

type KeyValueRowProps = {
  objKey: string
} & PropsWithChildren

const KeyValueRow = ({ objKey, children }: KeyValueRowProps): JSX.Element => {
  return (
    <Flex key={objKey} row alignItems="flex-start" gap="$spacing8">
      <Text color="$neutral2" py="$spacing4" variant="body3">
        {objKey}
      </Text>
      <Flex shrink gap="$spacing16" py="$spacing4">
        {children}
      </Flex>
    </Flex>
  )
}

// recursively parses typed data objects and adds margin to left
const getParsedObjectDisplay = ({
  chainId,
  obj,
  depth = 0,
}: {
  chainId: number
  // biome-ignore lint/suspicious/noExplicitAny: Function handles arbitrary JSON data structure
  obj: any
  depth?: number
}): JSX.Element => {
  if (depth === MAX_TYPED_DATA_PARSE_DEPTH + 1) {
    return <Text variant="body3">...</Text>
  }

  if (Array.isArray(obj) || obj === null || obj === undefined || typeof obj !== 'object') {
    return <Text variant="body3">{Array.isArray(obj) ? JSON.stringify(obj) : String(obj)}</Text>
  }

  return (
    <Flex gap="$spacing4">
      {Object.keys(obj).map((objKey) => {
        const childValue = obj[objKey]

        // Special case for address strings
        // TODO(WALL-7065): Handle SVM address validation as well
        if (
          typeof childValue === 'string' &&
          getValidAddress({ address: childValue, platform: Platform.EVM, withEVMChecksum: true })
        ) {
          return (
            <KeyValueRow key={objKey} objKey={objKey}>
              <Flex>
                <AddressButton address={childValue} chainId={chainId} textVariant="body3" />
              </Flex>
            </KeyValueRow>
          )
        }

        return (
          <KeyValueRow key={objKey} objKey={objKey}>
            {getParsedObjectDisplay({ chainId, obj: childValue, depth: depth + 1 })}
          </KeyValueRow>
        )
      })}
    </Flex>
  )
}

function TransactionDetails({
  chainId,
  transaction,
}: {
  chainId: UniverseChainId
  transaction: EthTransaction
}): JSX.Element {
  const { t } = useTranslation()
  const { parsedTransactionData, isLoading } = useNoYoloParser(transaction, chainId)
  const { to, value } = transaction

  const transactionCurrencies = useTransactionCurrencies({ chainId, to, parsedTransactionData })

  return (
    <Flex gap="$spacing12">
      {value && !BigNumber.from(value).eq(0) ? <SpendingEthDetails chainId={chainId} value={value} /> : null}
      {transactionCurrencies.map((currencyInfo, i) => (
        <SpendingDetails
          key={currencyInfo.currencyId}
          currencyInfo={currencyInfo}
          showLabel={i === 0}
          tokenCount={transactionCurrencies.length}
        />
      ))}
      {to ? (
        <ContentRow label={t('common.text.contract')} variant="body3">
          <AddressButton address={to} chainId={chainId} />
        </ContentRow>
      ) : null}
      <ContentRow label={t('walletConnect.request.details.label.function')} variant="body3">
        <Flex
          borderColor={isLoading ? '$transparent' : '$surface3'}
          borderRadius="$rounded12"
          borderWidth="$spacing1"
          px="$spacing8"
          py="$spacing2"
        >
          <Text color="$neutral1" loading={isLoading} variant="body3">
            {parsedTransactionData ? parsedTransactionData.name : t('common.text.unknown')}
          </Text>
        </Flex>
      </ContentRow>
    </Flex>
  )
}

type RequestDetailsProps = {
  request: WalletConnectSigningRequest
  permitInfo?: PermitInfo
}

function isSignTypedDataRequest(request: WalletConnectSigningRequest): request is SignRequest {
  return request.type === EthMethod.SignTypedData || request.type === EthMethod.SignTypedDataV4
}

export function RequestDetailsContent({ request }: RequestDetailsProps): JSX.Element {
  const { t } = useTranslation()

  if (isSignTypedDataRequest(request)) {
    try {
      const data = JSON.parse(request.rawMessage)
      return getParsedObjectDisplay({ chainId: request.chainId, obj: data.message })
    } catch (error) {
      logger.error(error, { tags: { file: 'RequestDetails', function: 'RequestDetailsContent' } })
      return <Text />
    }
  }

  if (isTransactionRequest(request)) {
    return <TransactionDetails chainId={request.chainId} transaction={request.transaction} />
  }

  const message = getStrMessage(request)
  return (
    <Text color="$neutral2" variant="body3">
      {message || t('qrScanner.request.message.unavailable')}
    </Text>
  )
}

export function RequestDetails({ request, permitInfo }: RequestDetailsProps): JSX.Element {
  if (isBatchedTransactionRequest(request)) {
    return <BatchedRequestDetailsContent calls={request.calls} chainId={request.chainId} />
  }

  return (
    <Flex
      backgroundColor={commonCardStyles.backgroundColor}
      borderColor={commonCardStyles.borderColor}
      borderRadius={commonCardStyles.borderRadius}
      borderWidth={commonCardStyles.borderWidth}
      my="$spacing4"
      mx="$spacing24"
    >
      {!permitInfo && (
        <Flex p="$spacing16" style={requestMessageStyle}>
          <ScrollView>
            <RequestDetailsContent request={request} />
          </ScrollView>
        </Flex>
      )}
    </Flex>
  )
}
