import { ResponsiveValue } from '@shopify/restyle'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppTheme } from 'src/app/hooks'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useENS } from 'src/features/ens/useENS'
import { EthMethod } from 'src/features/walletConnect/types'
import {
  isTransactionRequest,
  WalletConnectRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { Theme } from 'src/styles/theme'
import { isValidAddress, shortenAddress } from 'src/utils/addresses'
import { opacify } from 'src/utils/colors'
import { ExplorerDataType, getExplorerLink } from 'src/utils/linking'
import { logger } from 'src/utils/logger'

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
const getParsedObjectDisplay = (chainId: number, obj: any, depth = 0): any => {
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
            <Flex row alignItems="center" gap="xs" style={{ marginLeft: depth * 10 }}>
              <Text color="accentText2" variant="code">
                {objKey}
              </Text>
              <Flex flexShrink={1}>
                {isValidAddress(childValue, true) ? (
                  <AddressButton address={childValue} chainId={chainId} textVariant="code" />
                ) : (
                  <Text variant="code">{childValue}</Text>
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
    return (
      <Flex row alignItems="center">
        <Text color="neutralTextTertiary" variant="code">
          To:
        </Text>
        <AddressButton address={request.transaction.to} chainId={request.dapp.chain_id} />
      </Flex>
    )
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
