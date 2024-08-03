import { BigNumber } from 'ethers'
import { Transaction, TransactionDescription } from 'no-yolo-signatures'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { SignRequest, WalletConnectRequest, isTransactionRequest } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, useSporeColors } from 'ui/src'
import { TextVariantTokens, iconSizes } from 'ui/src/theme'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { EthMethod, EthTransaction } from 'uniswap/src/types/walletConnect'
import { getValidAddress, shortenAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useENS } from 'wallet/src/features/ens/useENS'
import { ContentRow } from 'wallet/src/features/transactions/TransactionRequest/ContentRow'
import { SpendingDetails } from 'wallet/src/features/transactions/TransactionRequest/SpendingDetails'
import { ExplorerDataType, getExplorerLink } from 'wallet/src/utils/linking'
import { useNoYoloParser } from 'wallet/src/utils/useNoYoloParser'

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
  const supportedChainId = toSupportedChainId(chainId) ?? UniverseChainId.Mainnet

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

const MAX_TYPED_DATA_PARSE_DEPTH = 3

// recursively parses typed data objects and adds margin to left
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getParsedObjectDisplay = (chainId: number, obj: any, depth = 0): JSX.Element => {
  if (depth === MAX_TYPED_DATA_PARSE_DEPTH + 1) {
    return <Text variant="body3">...</Text>
  }

  return (
    <Flex gap="$spacing4">
      {Object.keys(obj).map((objKey) => {
        const childValue = obj[objKey]

        if (typeof childValue === 'object') {
          return (
            <Flex key={objKey} gap="$spacing4">
              <Text color="$neutral2" variant="body3">
                {objKey}
              </Text>
              {getParsedObjectDisplay(chainId, childValue, depth + 1)}
            </Flex>
          )
        }

        if (typeof childValue === 'string') {
          return (
            <Flex key={objKey} row alignItems="flex-start" gap="$spacing8">
              <Text color="$neutral2" py="$spacing4" variant="body3">
                {objKey}
              </Text>
              <Flex shrink gap="$spacing16">
                {getValidAddress(childValue, true) ? (
                  <Flex py="$spacing4">
                    <AddressButton address={childValue} chainId={chainId} textVariant="body3" />
                  </Flex>
                ) : (
                  <Text py="$spacing4" variant="body3">
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
  chainId: WalletChainId
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
      {value && !BigNumber.from(value).eq(0) ? <SpendingDetails chainId={chainId} value={value} /> : null}
      {to ? (
        <ContentRow label={t('common.text.recipient')} variant="body3">
          <AddressButton address={to} chainId={chainId} />
        </ContentRow>
      ) : null}
      <ContentRow label={t('walletConnect.request.details.label.function')} variant="body3">
        <Flex
          borderColor={isLoading ? '$transparent' : '$surface3'}
          borderRadius="$rounded12"
          borderWidth={1}
          px="$spacing8"
          py="$spacing2"
        >
          <Text color="$neutral1" loading={isLoading} variant="body3">
            {parsedData ? parsedData.name : t('common.text.unknown')}
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
