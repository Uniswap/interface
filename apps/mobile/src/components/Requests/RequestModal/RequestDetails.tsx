import { BigNumber } from 'ethers'
import React, { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { SignRequest, WalletConnectRequest, isTransactionRequest } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, useSporeColors } from 'ui/src'
import { TextVariantTokens, iconSizes } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useENSName } from 'uniswap/src/features/ens/api'
import { EthMethod, EthTransaction } from 'uniswap/src/types/walletConnect'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { ContentRow } from 'wallet/src/features/transactions/TransactionRequest/ContentRow'
import {
  SpendingDetails,
  SpendingEthDetails,
} from 'wallet/src/features/transactions/TransactionRequest/SpendingDetails'
import { useNoYoloParser } from 'wallet/src/utils/useNoYoloParser'
import { useTransactionCurrencies } from 'wallet/src/utils/useTransactionCurrencies'

const getStrMessage = (request: WalletConnectRequest): string => {
  if (request.type === EthMethod.PersonalSign || request.type === EthMethod.EthSign) {
    return request.message || request.rawMessage
  }

  return ''
}

type AddressButtonProps = {
  address: string
  chainId: number
  textVariant?: TextVariantTokens
}

const AddressButton = ({ address, chainId, ...rest }: AddressButtonProps): JSX.Element => {
  const { data: name } = useENSName(address)
  const colors = useSporeColors()
  const { defaultChainId } = useEnabledChains()
  const supportedChainId = toSupportedChainId(chainId) ?? defaultChainId

  return (
    <LinkButton
      iconColor={colors.neutral3.val}
      label={name || shortenAddress(address)}
      size={iconSizes.icon16}
      textVariant="body3"
      url={getExplorerLink(supportedChainId, address, ExplorerDataType.ADDRESS)}
      {...rest}
    />
  )
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

const MAX_TYPED_DATA_PARSE_DEPTH = 3

// recursively parses typed data objects and adds margin to left
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getParsedObjectDisplay = (chainId: number, obj: any, depth = 0): JSX.Element => {
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
        if (typeof childValue === 'string' && getValidAddress(childValue, true)) {
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
            {getParsedObjectDisplay(chainId, childValue, depth + 1)}
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
      {transactionCurrencies?.map((currencyInfo, i) => (
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

type Props = {
  request: WalletConnectRequest
}

function isSignTypedDataRequest(request: WalletConnectRequest): request is SignRequest {
  return request.type === EthMethod.SignTypedData || request.type === EthMethod.SignTypedDataV4
}

export function RequestDetailsContent({ request }: Props): JSX.Element {
  const { t } = useTranslation()

  if (isSignTypedDataRequest(request)) {
    try {
      const data = JSON.parse(request.rawMessage)
      return getParsedObjectDisplay(request.chainId, data.message, 0)
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

export function RequestDetails({ request }: Props): JSX.Element {
  return (
    <ScrollView>
      <RequestDetailsContent request={request} />
    </ScrollView>
  )
}
