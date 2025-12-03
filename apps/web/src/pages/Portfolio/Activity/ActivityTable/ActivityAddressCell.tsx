import { AddressWithAvatar } from 'pages/Portfolio/Activity/ActivityTable/AddressWithAvatar'
import { buildActivityRowFragments } from 'pages/Portfolio/Activity/ActivityTable/registry'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { shortenHash } from 'utilities/src/addresses'

interface ActivityAddressCellProps {
  transaction: TransactionDetails
}

function _ActivityAddressCell({ transaction }: ActivityAddressCellProps) {
  const { t } = useTranslation()
  const { counterparty, protocolInfo } = buildActivityRowFragments(transaction)
  const transactionType = transaction.typeInfo.type

  // Use counterparty from adapter if available, otherwise fall back to from address
  const rawAddress = counterparty ?? transaction.from
  const otherPartyAddress = rawAddress ? getValidAddress({ address: rawAddress, chainId: transaction.chainId }) : null

  // Determine what to show based on transaction type and available data
  const showProtocol =
    protocolInfo &&
    transactionType !== TransactionType.Send &&
    transactionType !== TransactionType.Receive &&
    transactionType !== TransactionType.Swap &&
    transactionType !== TransactionType.Bridge
  const showAddress = !showProtocol && otherPartyAddress
  const showTransactionHash = transactionType === TransactionType.Swap || transactionType === TransactionType.Bridge

  const label = useMemo(() => {
    if (transactionType === TransactionType.Send) {
      return t('common.text.recipient')
    } else if (transactionType === TransactionType.Receive) {
      return t('common.text.sender')
    } else if (transactionType === TransactionType.Swap || transactionType === TransactionType.Bridge) {
      return t('transaction.details.transaction')
    } else if (showProtocol) {
      return t('common.protocol')
    }
    return undefined
  }, [transactionType, showProtocol, t])

  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%">
      <Flex gap="$gap4">
        {label && (
          <Text variant="body4" color="$neutral2">
            {label}
          </Text>
        )}
        {showProtocol ? (
          <Flex row alignItems="center" gap="$spacing6">
            {protocolInfo.logoUrl && (
              <img
                src={protocolInfo.logoUrl}
                alt={protocolInfo.name}
                width={iconSizes.icon18}
                height={iconSizes.icon18}
                style={{ borderRadius: '4px' }}
              />
            )}
            <Text variant="body3" color="$neutral1">
              {protocolInfo.name}
            </Text>
          </Flex>
        ) : showTransactionHash ? (
          <Text variant="body3" color="$neutral1">
            {shortenHash(transaction.hash)}
          </Text>
        ) : (
          showAddress && <AddressWithAvatar address={otherPartyAddress} />
        )}
      </Flex>
    </Flex>
  )
}

export const ActivityAddressCell = memo(_ActivityAddressCell)
