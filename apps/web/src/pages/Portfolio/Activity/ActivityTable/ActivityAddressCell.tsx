import { getValidAddress, type UniverseChainId } from '@universe/chains'
import { Flex, iconSizes, Text } from '@universe/mycelium'
import { EarnSparkle } from '@universe/mycelium/icons/EarnSparkle'
import { TestID } from '@universe/test'
import type { TFunction } from 'i18next'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { getEarnPlanTransactionType } from 'uniswap/src/features/earn/planActivityTitles'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isPlanTransactionInfo } from 'uniswap/src/features/transactions/types/utils'
import { shortenHash } from 'utilities/src/addresses'
import { AddressHoverCard, useShowsAddressHoverCard } from '~/components/AddressHoverCard/AddressHoverCard'
import { InternalLink } from '~/components/InternalLink'
import type { ActivityProtocolInfo } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'
import { AddressWithAvatar } from '~/pages/Portfolio/Activity/ActivityTable/AddressWithAvatar'
import { buildActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/registry'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

interface ActivityAddressCellProps {
  transaction: TransactionDetails
}

type EarnActivityAddressDirection = 'to' | 'from'

type ActivityAddressContent =
  | { type: 'earn' }
  | { type: 'protocol'; protocolInfo: ActivityProtocolInfo }
  | { type: 'transactionActions'; actionCount: number }
  | { type: 'transactionHash'; hash: string }
  | { type: 'address'; address: Address; chainId: UniverseChainId }

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
): EarnActivityAddressDirection | undefined {
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

function getAddressContent(address: Address | null, chainId: UniverseChainId): ActivityAddressContent | undefined {
  return address ? { type: 'address', address, chainId } : undefined
}

export function getActivityAddressDisplay({
  t,
  transaction,
  otherPartyAddress,
  protocolInfo,
}: {
  t: TFunction
  transaction: TransactionDetails
  otherPartyAddress: Address | null
  protocolInfo: ActivityProtocolInfo | null | undefined
}): ActivityAddressDisplay {
  const transactionType = transaction.typeInfo.type
  const earnActivityAddressDirection = getEarnActivityAddressDirection(transaction)

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
    // Wraps reach this arm rather than the protocol fallback below: the adapter resolves protocol
    // metadata for them, but a wrap's protocol version is noise, so show the hash like other trades.
    case TransactionType.Wrap:
    case TransactionType.Swap:
    case TransactionType.Bridge:
    case TransactionType.UniswapXCancel:
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

// Prevents copy clicks from bubbling to the row, which opens the transaction details modal
const stopPropagation = (e: { stopPropagation: () => void }): void => e.stopPropagation()

function PrioritizedContent({
  content,
  t,
}: {
  content: ActivityAddressContent | undefined
  t: TFunction
}): JSX.Element | null {
  const showsHoverCard = useShowsAddressHoverCard(content?.type === 'address' ? content.address : undefined)

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
        <Flex onPress={stopPropagation}>
          <CopyHelper
            toCopy={content.hash}
            iconPosition="right"
            iconSize={iconSizes.icon16}
            iconColor="$neutral2"
            testID={TestID.PortfolioActivityCopyTransactionHash}
          >
            <Text variant="body3" color="$neutral1">
              {shortenHash(content.hash)}
            </Text>
          </CopyHelper>
        </Flex>
      )
    case 'address': {
      return (
        <Flex row alignItems="center" gap="$gap4">
          <AddressHoverCard address={content.address} chainId={content.chainId}>
            <InternalLink
              to={buildPortfolioUrl({ externalAddress: content.address })}
              hoverStyle={ClickableTamaguiStyle.hoverStyle}
            >
              <AddressWithAvatar address={content.address} />
            </InternalLink>
          </AddressHoverCard>
          {!showsHoverCard && (
            <Flex onPress={stopPropagation}>
              <CopyHelper
                toCopy={content.address}
                iconSize={iconSizes.icon16}
                iconColor="$neutral2"
                testID={TestID.PortfolioActivityCopyAddress}
              />
            </Flex>
          )}
        </Flex>
      )
    }
    default:
      return null
  }
}

function ActivityAddressCellInner({ transaction }: ActivityAddressCellProps) {
  const { t } = useTranslation()
  const { counterparty, protocolInfo } = buildActivityRowFragments(transaction)

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
