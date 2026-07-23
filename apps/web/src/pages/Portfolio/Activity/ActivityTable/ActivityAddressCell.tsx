import type { TFunction } from 'i18next'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { EarnSparkle } from 'ui/src/components/icons/EarnSparkle'
import { iconSizes } from 'ui/src/theme'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getEarnPlanTransactionType } from 'uniswap/src/features/earn/planActivityTitles'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isPlanTransactionInfo } from 'uniswap/src/features/transactions/types/utils'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { shortenHash } from 'utilities/src/addresses'
import { AddressHoverCard } from '~/components/AddressHoverCard/AddressHoverCard'
import { InternalLink } from '~/components/InternalLink'
import type { ActivityProtocolInfo } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'
import { AddressWithAvatar } from '~/pages/Portfolio/Activity/ActivityTable/AddressWithAvatar'
import { buildActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/registry'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

interface ActivityAddressCellProps {
  transaction: TransactionDetails
  isEarnActivityDisplayEnabled?: boolean
}

type EarnActivityAddressDirection = 'to' | 'from'

type ActivityAddressContent =
  | { type: 'earn' }
  | { type: 'protocol'; protocolInfo: ActivityProtocolInfo }
  | { type: 'transactionActions'; actionCount: number }
  | { type: 'transactionHash'; hash: string }
  | { type: 'address'; address: Address; chainId: number }

interface ActivityAddressDisplay {
  label?: string
  content?: ActivityAddressContent
  gap?: 2 | '$gap4'
}

const EARN_ACTIVITY_ADDRESS_LABEL_KEY: Record<EarnActivityAddressDirection, string> = {
  to: 'common.text.recipient',
  from: 'common.text.sender',
}

export function getEarnActivityAddressDirection(
  transaction: TransactionDetails,
  { isEarnActivityDisplayEnabled = true }: { isEarnActivityDisplayEnabled?: boolean } = {},
): EarnActivityAddressDirection | undefined {
  if (!isEarnActivityDisplayEnabled) {
    return undefined
  }

  const { typeInfo } = transaction

  if (typeInfo.type === TransactionType.Deposit && typeInfo.isVault) {
    return 'to'
  }

  if (typeInfo.type === TransactionType.Withdraw && typeInfo.isVault) {
    return 'from'
  }

  if (typeInfo.type === TransactionType.Plan && typeInfo.earnAction) {
    return getEarnPlanTransactionType(typeInfo.earnAction) === TransactionType.Withdraw ? 'from' : 'to'
  }

  return undefined
}

function getAddressContent(address: Address | null, chainId: number): ActivityAddressContent | undefined {
  return address ? { type: 'address', address, chainId } : undefined
}

function getActivityAddressDisplay({
  t,
  transaction,
  otherPartyAddress,
  protocolInfo,
  isEarnActivityDisplayEnabled,
}: {
  t: TFunction
  transaction: TransactionDetails
  otherPartyAddress: Address | null
  protocolInfo: ActivityProtocolInfo | null | undefined
  isEarnActivityDisplayEnabled: boolean
}): ActivityAddressDisplay {
  const transactionType = transaction.typeInfo.type
  const earnActivityAddressDirection = getEarnActivityAddressDirection(transaction, { isEarnActivityDisplayEnabled })

  if (earnActivityAddressDirection) {
    return {
      label: t(EARN_ACTIVITY_ADDRESS_LABEL_KEY[earnActivityAddressDirection]),
      content: { type: 'earn' },
      gap: 2,
    }
  }

  switch (transactionType) {
    case TransactionType.Send:
      return {
        label: t('common.text.recipient'),
        content: getAddressContent(otherPartyAddress, transaction.chainId),
      }
    case TransactionType.Receive:
      return {
        label: t('common.text.sender'),
        content: getAddressContent(otherPartyAddress, transaction.chainId),
      }
    case TransactionType.Swap:
    case TransactionType.Bridge:
      return {
        label: t('transaction.details.transaction'),
        content: transaction.hash ? { type: 'transactionHash', hash: transaction.hash } : undefined,
      }
    case TransactionType.Plan:
      return {
        label: t('transaction.details.transactions'),
        content: isPlanTransactionInfo(transaction.typeInfo)
          ? {
              type: 'transactionActions',
              actionCount: transaction.typeInfo.stepDetails.length,
            }
          : undefined,
      }
    default:
      if (protocolInfo) {
        return {
          label: t('common.protocol'),
          content: { type: 'protocol', protocolInfo },
        }
      }

      return {
        content: getAddressContent(otherPartyAddress, transaction.chainId),
      }
  }
}

function PrioritizedContent({
  content,
  t,
}: {
  content: ActivityAddressContent | undefined
  t: TFunction
}): JSX.Element | null {
  if (!content) {
    return null
  }

  switch (content.type) {
    case 'earn':
      return (
        <Flex row alignItems="center" gap="$spacing6">
          <EarnSparkle size="$icon.16" color="$accent1" />
          <Text variant="body3" color="$neutral1">
            {t('explore.earn.title')}
          </Text>
        </Flex>
      )
    case 'protocol':
      return (
        <Flex row alignItems="center" gap="$spacing6">
          {content.protocolInfo.logoUrl && (
            <img
              src={content.protocolInfo.logoUrl}
              alt={content.protocolInfo.name}
              width={iconSizes.icon18}
              height={iconSizes.icon18}
              style={{ borderRadius: '4px' }}
            />
          )}
          <Text variant="body3" color="$neutral1">
            {content.protocolInfo.name}
          </Text>
        </Flex>
      )
    case 'transactionActions':
      return (
        <Text variant="body3" color="$neutral1">
          {t('transaction.details.transactions.actions', {
            actionCount: content.actionCount,
          })}
        </Text>
      )
    case 'transactionHash':
      return (
        <Text variant="body3" color="$neutral1">
          {shortenHash(content.hash)}
        </Text>
      )
    case 'address': {
      const chainInfo = getChainInfo(content.chainId)

      return (
        <AddressHoverCard address={content.address} platform={chainInfo.platform}>
          <InternalLink
            to={buildPortfolioUrl({ externalAddress: content.address })}
            hoverStyle={ClickableTamaguiStyle.hoverStyle}
          >
            <AddressWithAvatar address={content.address} />
          </InternalLink>
        </AddressHoverCard>
      )
    }
    default:
      return null
  }
}

function ActivityAddressCellInner({ transaction, isEarnActivityDisplayEnabled = true }: ActivityAddressCellProps) {
  const { t } = useTranslation()
  const { counterparty, protocolInfo } = buildActivityRowFragments(transaction, { isEarnActivityDisplayEnabled })

  // Use counterparty from adapter if available, otherwise fall back to from address
  const rawAddress = counterparty ?? transaction.from
  const otherPartyAddress = rawAddress ? getValidAddress({ address: rawAddress, chainId: transaction.chainId }) : null
  const {
    label,
    content,
    gap = '$gap4',
  } = getActivityAddressDisplay({
    t,
    transaction,
    otherPartyAddress,
    protocolInfo,
    isEarnActivityDisplayEnabled,
  })

  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%">
      <Flex gap={gap}>
        {label && (
          <Text variant="body4" color="$neutral2">
            {label}
          </Text>
        )}
        <PrioritizedContent content={content} t={t} />
      </Flex>
    </Flex>
  )
}

export const ActivityAddressCell = memo(ActivityAddressCellInner)
