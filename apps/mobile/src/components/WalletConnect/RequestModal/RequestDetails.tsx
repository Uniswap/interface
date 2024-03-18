import { BigNumber } from 'ethers'
import { Transaction, TransactionDescription } from 'no-yolo-signatures'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { SpendingDetails } from 'src/components/WalletConnect/RequestModal/SpendingDetails'
import {
  isTransactionRequest,
  SignRequest,
  WalletConnectRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { useNoYoloParser } from 'src/utils/useNoYoloParser'
import { Flex, Text, useSporeColors } from 'ui/src'
import { iconSizes, TextVariantTokens } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { useENS } from 'wallet/src/features/ens/useENS'
import { EthMethod, EthTransaction } from 'wallet/src/features/walletConnect/types'
import { getValidAddress, shortenAddress } from 'wallet/src/utils/addresses'
import { ExplorerDataType, getExplorerLink } from 'wallet/src/utils/linking'

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
  const { name } = useENS(chainId, address, false)
  const colors = useSporeColors()
  const supportedChainId = toSupportedChainId(chainId) ?? ChainId.Mainnet

  return (
    <LinkButton
      backgroundColor="$surface3"
      borderRadius="$rounded12"
      iconColor={colors.neutral1.val}
      label={name || shortenAddress(address)}
      px="$spacing8"
      py="$spacing4"
      size={iconSizes.icon16}
      textVariant="body2"
      url={getExplorerLink(supportedChainId, address, ExplorerDataType.ADDRESS)}
      {...rest}
    />
  )
}

const MAX_TYPED_DATA_PARSE_DEPTH = 3

// recursively parses typed data objects and adds margin to left
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getParsedObjectDisplay = (chainId: number, obj: any, depth = 0): JSX.Element => {
  if (depth === MAX_TYPED_DATA_PARSE_DEPTH + 1) {
    return <Text variant="monospace">...</Text>
  }

  return (
    <Flex gap="$spacing4">
      {Object.keys(obj).map((objKey) => {
        const childValue = obj[objKey]

        if (typeof childValue === 'object') {
          return (
            <Flex key={objKey} gap="$spacing4">
              <Text color="$neutral2" style={{ marginLeft: depth * 10 }} variant="monospace">
                {objKey}
              </Text>
              {getParsedObjectDisplay(chainId, childValue, depth + 1)}
            </Flex>
          )
        }

        if (typeof childValue === 'string') {
          return (
            <Flex
              key={objKey}
              row
              alignItems="flex-start"
              gap="$spacing8"
              style={{ marginLeft: depth * 10 }}>
              <Text color="$neutral2" py="$spacing4" variant="monospace">
                {objKey}
              </Text>
              <Flex shrink gap="$spacing16">
                {getValidAddress(childValue, true) ? (
                  <AddressButton address={childValue} chainId={chainId} textVariant="monospace" />
                ) : (
                  <Text py="$spacing4" variant="monospace">
                    {childValue}
                  </Text>
                )}
              </Flex>
            </Flex>
          )
        }

        // TODO: [MOB-216] handle array child types
        return null
      })}
    </Flex>
  )
}

function TransactionDetails({
  chainId,
  transaction,
}: {
  chainId: ChainId
  transaction: EthTransaction
}): JSX.Element {
  const { t } = useTranslation()
  const parser = useNoYoloParser(chainId)

  const [isLoading, setIsLoading] = useState(true)
  const [parsedData, setParsedData] = useState<TransactionDescription | undefined>(undefined)

  const { from, to, value, data } = transaction

  useEffect(() => {
    const parseResult = async (): Promise<TransactionDescription | undefined> => {
      // no-yolo-parser library expects these fields to be defined
      if (!from || !to || !value || !data) {
        return
      }
      return parser.parseAsResult(transaction as Transaction).then((result) => {
        if (!result.transactionDescription.ok) {
          throw result.transactionDescription.error
        }

        return result.transactionDescription.result
      })
    }

    parseResult()
      .then((result) => {
        setParsedData(result)
      })
      .catch((error) => {
        setParsedData(undefined)
        logger.warn('RequestMessage', 'DecodedDataDetails', 'Could not parse data', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [data, from, parser, to, transaction, value])

  return (
    <Flex gap="$spacing12">
      {value && !BigNumber.from(value).eq(0) ? (
        <SpendingDetails chainId={chainId} value={value} />
      ) : null}
      {to ? (
        <Flex row alignItems="center" gap="$spacing16">
          <Text color="$neutral2" variant="body2">
            {t('walletConnect.request.details.label.recipient')}
          </Text>
          <AddressButton address={to} chainId={chainId} />
        </Flex>
      ) : null}
      <Flex row alignItems="center" gap="$spacing16">
        <Text color="$neutral2" variant="body2">
          {t('walletConnect.request.details.label.function')}
        </Text>
        <Flex
          backgroundColor={isLoading ? '$transparent' : '$surface3'}
          borderRadius="$rounded12"
          px="$spacing8"
          py="$spacing4">
          <Text color="$neutral1" loading={isLoading} variant="monospace">
            {parsedData ? parsedData.name : t('common.text.unknown')}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

type Props = {
  request: WalletConnectRequest
}

function isSignTypedDataRequest(request: WalletConnectRequest): request is SignRequest {
  return request.type === EthMethod.SignTypedData || request.type === EthMethod.SignTypedDataV4
}

function RequestDetailsContent({ request }: Props): JSX.Element {
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
  return message ? (
    <Text variant="body2">{message}</Text>
  ) : (
    <Text color="$neutral2" variant="body2">
      {t('qrScanner.request.message.unavailable')}
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
