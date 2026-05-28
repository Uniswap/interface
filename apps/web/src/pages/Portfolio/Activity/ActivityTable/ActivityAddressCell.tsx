import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isPlanTransactionInfo } from 'uniswap/src/features/transactions/types/utils'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { shortenHash } from 'utilities/src/addresses'
import { AddressHoverCard } from '~/components/AddressHoverCard/AddressHoverCard'
import { InternalLink } from '~/components/InternalLink'
import { AddressWithAvatar } from '~/pages/Portfolio/Activity/ActivityTable/AddressWithAvatar'
import { buildActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/registry'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

interface ActivityAddressCellProps {
  transaction: TransactionDetails
}

function ActivityAddressCellInner({ transaction }: ActivityAddressCellProps) {
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
  const showTransactionActions = transactionType === TransactionType.Plan

  const label = useMemo(() => {
    if (transactionType === TransactionType.Send) {
      return t('common.text.recipient')
    } else if (transactionType === TransactionType.Receive) {
      return t('common.text.sender')
    } else if (transactionType === TransactionType.Swap || transactionType === TransactionType.Bridge) {
      return t('transaction.details.transaction')
    } else if (transactionType === TransactionType.Plan) {
      return t('transaction.details.transactions')
    } else if (showProtocol) {
      return t('common.protocol')
    }
    return undefined
  }, [transactionType, showProtocol, t])

  const addressContent = showAddress ? <AddressWithAvatar address={otherPartyAddress} /> : null
  const chainInfo = getChainInfo(transaction.chainId)

  const PrioritizedContent = () => {
    if (showProtocol) {
      return (
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
      )
    } else if (showTransactionActions) {
      if (!isPlanTransactionInfo(transaction.typeInfo)) {
        return null
      }
      return (
        <Text variant="body3" color="$neutral1">
          {t('transaction.details.transactions.actions', {
            actionCount: transaction.typeInfo.stepDetails.length,
          })}
        </Text>
      )
    } else if (showTransactionHash) {
      return (
        <Text variant="body3" color="$neutral1">
          {shortenHash(transaction.hash)}
        </Text>
      )
    } else if (showAddress) {
      return (
        <AddressHoverCard address={otherPartyAddress} platform={chainInfo.platform}>
          <InternalLink
            to={buildPortfolioUrl({ externalAddress: otherPartyAddress! })}
            hoverStyle={ClickableTamaguiStyle.hoverStyle}
          >
            {addressContent}
          </InternalLink>
        </AddressHoverCard>
      )
    }
    return null
  }

  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%">
      <Flex gap="$gap4">
        {label && (
          <Text variant="body4" color="$neutral2">
            {label}
          </Text>
        )}
        <PrioritizedContent />
      </Flex>
    </Flex>
  )
}

export const ActivityAddressCell = memo(ActivityAddressCellInner)
