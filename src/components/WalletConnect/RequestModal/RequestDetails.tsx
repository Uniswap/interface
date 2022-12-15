import { BigNumber } from 'ethers'
import { Transaction, TransactionDescription } from 'no-yolo-signatures'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { SpendingDetails } from 'src/components/WalletConnect/RequestModal/SpendingDetails'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { EthMethod, EthTransaction } from 'src/features/walletConnect/types'
import {
  isTransactionRequest,
  WalletConnectRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { Theme } from 'src/styles/theme'
import { getValidAddress, shortenAddress } from 'src/utils/addresses'
import { ExplorerDataType, getExplorerLink } from 'src/utils/linking'
import { logger } from 'src/utils/logger'
import { useNoYoloParser } from 'src/utils/useNoYoloParser'

const getStrMessage = (request: WalletConnectRequest) => {
  if (request.type === EthMethod.PersonalSign || request.type === EthMethod.EthSign) {
    return request.message || request.rawMessage
  }

  return ''
}

type AddressButtonProps = {
  address: string
  chainId: number
  textVariant?: keyof Theme['textVariants']
}

const AddressButton = ({ address, chainId, ...rest }: AddressButtonProps) => {
  const { name } = useENS(chainId, address, false)
  return (
    <LinkButton
      backgroundColor="backgroundOutline"
      borderRadius="xs"
      label={name || shortenAddress(address)}
      px="xs"
      py="xxs"
      textVariant="bodySmall"
      url={getExplorerLink(chainId, address, ExplorerDataType.ADDRESS)}
      {...rest}
    />
  )
}

const MAX_TYPED_DATA_PARSE_DEPTH = 3

// recursively parses typed data objects and adds margin to left
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getParsedObjectDisplay = (chainId: number, obj: any, depth = 0) => {
  if (depth === MAX_TYPED_DATA_PARSE_DEPTH + 1) {
    return <Text variant="monospace">...</Text>
  }

  return (
    <Flex gap="xxs">
      {Object.keys(obj).map((objKey) => {
        const childValue = obj[objKey]

        if (typeof childValue === 'object') {
          return (
            <Flex gap="xxs">
              <Text color="textTertiary" style={{ marginLeft: depth * 10 }} variant="monospace">
                {objKey}
              </Text>
              {getParsedObjectDisplay(chainId, childValue, depth + 1)}
            </Flex>
          )
        }

        if (typeof childValue === 'string') {
          return (
            <Flex row alignItems="flex-start" gap="xs" style={{ marginLeft: depth * 10 }}>
              <Text color="textTertiary" py="xxs" variant="monospace">
                {objKey}
              </Text>
              <Flex flexShrink={1}>
                {getValidAddress(childValue, true) ? (
                  <AddressButton address={childValue} chainId={chainId} textVariant="monospace" />
                ) : (
                  <Text py="xxs" variant="monospace">
                    {childValue}
                  </Text>
                )}
              </Flex>
            </Flex>
          )
        }

        // TODO: [MOB-3881] handle array child types
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
}) {
  const { t } = useTranslation()
  const parser = useNoYoloParser(chainId)

  const [isLoading, setIsLoading] = useState(true)
  const [parsedData, setParsedData] = useState<TransactionDescription | undefined>(undefined)

  const { from, to, value, data } = transaction

  useEffect(() => {
    const parseResult = async () => {
      // no-yolo-parser library expects these fields to be defined
      if (!from || !to || !value || !data) return
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
        logger.info('RequestMessage', 'DecodedDataDetails', 'Could not parse data', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [data, from, parser, to, transaction, value])

  return (
    <Flex gap="sm">
      {value && !BigNumber.from(value).eq(0) ? (
        <SpendingDetails chainId={chainId} value={value} />
      ) : null}
      {to ? (
        <Flex row alignItems="center" gap="md">
          <Text color="textSecondary" variant="bodySmall">
            {t('To')}:
          </Text>
          <AddressButton address={to} chainId={chainId} />
        </Flex>
      ) : null}
      <Flex row alignItems="center" gap="md">
        <Text color="textSecondary" variant="bodySmall">
          {t('Function')}:
        </Text>
        <Box
          backgroundColor={isLoading ? 'none' : 'backgroundOutline'}
          borderRadius="xs"
          px="xs"
          py="xxs">
          <Text color="textPrimary" loading={isLoading} variant="monospace">
            {parsedData ? parsedData.name : t('Unknown')}
          </Text>
        </Box>
      </Flex>
    </Flex>
  )
}

type Props = {
  request: WalletConnectRequest
}

function RequestDetailsContent({ request }: Props) {
  const { t } = useTranslation()

  if (request.type === EthMethod.SignTypedData) {
    try {
      const data = JSON.parse(request.rawMessage)
      return getParsedObjectDisplay(request.dapp.chain_id, data.message, 0)
    } catch (e) {
      logger.error('WalletConnectRequestModal', 'getMessage', 'invalid JSON message', e)
      return <Text />
    }
  }

  if (isTransactionRequest(request)) {
    return <TransactionDetails chainId={request.dapp.chain_id} transaction={request.transaction} />
  }

  const message = getStrMessage(request)
  return message ? (
    <Text variant="bodySmall">{message}</Text>
  ) : (
    <Text color="textSecondary" variant="bodySmall">
      {t('No message found.')}
    </Text>
  )
}

export function RequestDetails({ request }: Props) {
  return (
    <ScrollView>
      <RequestDetailsContent request={request} />
    </ScrollView>
  )
}
