import { ResponsiveValue } from '@shopify/restyle'
import { TransactionDescription } from 'no-yolo-signatures'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppTheme } from 'src/app/hooks'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { EthMethod, EthTransaction } from 'src/features/walletConnect/types'
import {
  isTransactionRequest,
  WalletConnectRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { Theme } from 'src/styles/theme'
import { isValidAddress, shortenAddress } from 'src/utils/addresses'
import { opacify } from 'src/utils/colors'
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
  textVariant?: ResponsiveValue<keyof Theme['textVariants'], Theme>
}

const AddressButton = ({ address, chainId, ...rest }: AddressButtonProps) => {
  const { name } = useENS(chainId, address, false)
  const theme = useAppTheme()
  return (
    <LinkButton
      borderRadius="xs"
      label={name || shortenAddress(address)}
      px="xs"
      py="xxs"
      style={{ backgroundColor: opacify(20, theme.colors.black) }}
      textVariant="body2"
      url={getExplorerLink(chainId, address, ExplorerDataType.ADDRESS)}
      {...rest}
    />
  )
}

const MAX_TYPED_DATA_PARSE_DEPTH = 3

// recursively parses typed data objects and adds margin to left
const getParsedObjectDisplay = (chainId: number, obj: any, depth = 0) => {
  if (depth === MAX_TYPED_DATA_PARSE_DEPTH + 1) {
    return <Text variant="code">...</Text>
  }

  return (
    <Flex gap="xxs">
      {Object.keys(obj).map((objKey) => {
        const childValue = obj[objKey]

        if (typeof childValue === 'object') {
          return (
            <Flex gap="xxs">
              <Text color="accentText2" style={{ marginLeft: depth * 10 }} variant="code">
                {objKey}
              </Text>
              {getParsedObjectDisplay(chainId, childValue, depth + 1)}
            </Flex>
          )
        }

        if (typeof childValue === 'string') {
          return (
            <Flex row alignItems="flex-start" gap="xs" style={{ marginLeft: depth * 10 }}>
              <Text color="accentText2" py="xxs" variant="code">
                {objKey}
              </Text>
              <Flex flexShrink={1}>
                {isValidAddress(childValue, true) ? (
                  <AddressButton address={childValue} chainId={chainId} textVariant="code" />
                ) : (
                  <Text py="xxs" variant="code">
                    {childValue}
                  </Text>
                )}
              </Flex>
            </Flex>
          )
        }

        // TODO: handle array child types
        return null
      })}
    </Flex>
  )
}

function TransactionMessage({
  chainId,
  transaction,
}: {
  chainId: ChainId
  transaction: EthTransaction
}) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const parser = useNoYoloParser(chainId)

  const [isLoading, setIsLoading] = useState(true)
  const [parsedData, setParsedData] = useState<TransactionDescription | undefined>(undefined)

  useEffect(() => {
    const parseResult = async () => {
      return parser.parseAsResult(transaction).then((result) => {
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
  }, [parser, transaction])

  return (
    <Flex gap="xs">
      <Flex row alignItems="center" gap="xs">
        <Text color="neutralTextSecondary" variant="body2">
          To:
        </Text>
        <AddressButton address={transaction.to} chainId={chainId} />
      </Flex>
      {isLoading || !parsedData ? (
        <Text color="neutralTextTertiary" py="xxs" variant="body2">
          {isLoading ? ' ' : t('Unable to decode this transaction request')}
        </Text>
      ) : (
        <Flex row alignItems="center" gap="xs">
          <Text color="neutralTextSecondary" py="xxs" variant="body2">
            Function:{' '}
          </Text>
          <Box
            borderRadius="xs"
            px="xs"
            py="xxs"
            style={{ backgroundColor: opacify(20, theme.colors.black) }}>
            <Text color="neutralTextPrimary" variant="code">
              {parsedData.name}
            </Text>
          </Box>
        </Flex>
      )}
    </Flex>
  )
}

type Props = {
  request: WalletConnectRequest
}

function RequestMessageContent({ request }: Props) {
  const { t } = useTranslation()

  if (request.type === EthMethod.SignTypedData) {
    try {
      const data = JSON.parse(request.rawMessage)
      return getParsedObjectDisplay(request.dapp.chain_id, data.message, 0)
    } catch (e) {
      logger.error('WalletConnectRequestModal', 'getMessage', 'invalid JSON message', e)
      return <Text>{''}</Text>
    }
  }

  if (isTransactionRequest(request)) {
    return <TransactionMessage chainId={request.dapp.chain_id} transaction={request.transaction} />
  }

  const message = getStrMessage(request)
  return message ? (
    <Text variant="body2">{message}</Text>
  ) : (
    <Text color="neutralTextSecondary" variant="body2">
      {t('No message found.')}
    </Text>
  )
}

export function RequestMessage({ request }: Props) {
  return (
    <ScrollView>
      <RequestMessageContent request={request} />
    </ScrollView>
  )
}
