import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Skeleton, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import type {
  LpIncentiveRewardChainGroup,
  LpIncentiveRewardRow,
} from '~/features/Liquidity/LPIncentives/buildLpIncentiveRewards'
import { lpRewardsCollectKey, useCollectLpRewards } from '~/features/Liquidity/LPIncentives/hooks/useCollectLpRewards'
import { useLpIncentiveRewards } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewards'

interface LpIncentivesRewardsModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress?: string
}

// Passed from the modal down to each Collect button so only the in-flight claim spins
// and the rest are disabled (one claim at a time).
interface CollectControls {
  collect: ReturnType<typeof useCollectLpRewards>['collect']
  activeKey?: string
  isClaiming: boolean
}

function RewardTokenRow({
  row,
  formatUsd,
  collect,
  activeKey,
  isClaiming,
}: { row: LpIncentiveRewardRow; formatUsd: (value: number) => string } & CollectControls): JSX.Element {
  const { t } = useTranslation()
  const currencyInfo = useCurrencyInfo(buildCurrencyId(row.token.chainId, row.token.address))
  const key = lpRewardsCollectKey(row.token.chainId, [row.token.address])
  const onCollect = useEvent(() => collect({ chainId: row.token.chainId, tokenAddresses: [row.token.address] }))
  // An unpriced reward is still claimable, so the row falls back to naming the token — a USD
  // figure is the only label a priced row carries, and "$0.00" would misreport a real balance.
  const { usdValue } = row
  const isUnpriced = usdValue === undefined
  // `||`, not `??`: `token.symbol` is a protobuf string field, so it's '' rather than undefined when
  // the backend has no symbol. An unlisted token would otherwise label a live Collect button blank.
  const symbol = currencyInfo?.currency.symbol || row.token.symbol || '—'
  const label = usdValue === undefined ? symbol : formatUsd(usdValue)

  return (
    <Flex row alignItems="center" justifyContent="space-between" gap="$gap12" minHeight={48}>
      <Flex row alignItems="center" gap="$gap12" fill>
        <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon24} />
        {/* Dimmed when unpriced so a symbol occupying the USD slot doesn't read as an amount —
            a token whose symbol looks like a dollar figure would otherwise be indistinguishable. */}
        <Text variant="body1" color={isUnpriced ? '$neutral2' : '$neutral1'}>
          {label}
        </Text>
      </Flex>
      <Button
        size="small"
        emphasis="secondary"
        fill={false}
        loading={activeKey === key}
        disabled={isClaiming && activeKey !== key}
        onPress={onCollect}
      >
        {t('common.collect.button')}
      </Button>
    </Flex>
  )
}

// Shared by both chain layouts so the collect-all key and the "more than one token" rule can't
// drift between them; only the button's size and placement differ.
function useCollectAllForChain(
  group: LpIncentiveRewardChainGroup,
  collect: CollectControls['collect'],
): { key: string; onCollectAll: () => void; showCollectAll: boolean } {
  const tokenAddresses = group.rows.map((row) => row.token.address)
  const onCollectAll = useEvent(() => collect({ chainId: group.chainId, tokenAddresses }))

  return {
    key: lpRewardsCollectKey(group.chainId, tokenAddresses),
    onCollectAll,
    // A single-token chain already has its Collect button on the row; a chain-level "Collect all"
    // would be a redundant claim of the same token.
    showCollectAll: group.rows.length > 1,
  }
}

function RewardChainGroup({
  group,
  formatUsd,
  collect,
  activeKey,
  isClaiming,
}: { group: LpIncentiveRewardChainGroup; formatUsd: (value: number) => string } & CollectControls): JSX.Element {
  const { t } = useTranslation()
  const chainInfo = getChainInfo(group.chainId)
  const { key, onCollectAll, showCollectAll } = useCollectAllForChain(group, collect)

  return (
    <Flex>
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        gap="$gap12"
        minHeight={48}
        borderBottomWidth={1}
        borderBottomColor="$surface3"
      >
        <Flex row alignItems="center" gap="$gap8" fill>
          <NetworkLogo chainId={group.chainId} size={iconSizes.icon20} shape="square" />
          <Text variant="body1" color="$neutral2">
            {chainInfo.name}
          </Text>
        </Flex>
        {showCollectAll && (
          <Button
            size="small"
            emphasis="primary"
            fill={false}
            loading={activeKey === key}
            disabled={isClaiming && activeKey !== key}
            onPress={onCollectAll}
          >
            {t('pool.incentives.collectAll')}
          </Button>
        )}
      </Flex>
      {group.rows.map((row) => (
        <RewardTokenRow
          key={`${row.token.chainId}:${row.token.address}`}
          row={row}
          formatUsd={formatUsd}
          collect={collect}
          activeKey={activeKey}
          isClaiming={isClaiming}
        />
      ))}
    </Flex>
  )
}

// Single-chain layout: no chain header, just token rows + one full-width "Collect all" at the bottom.
function SingleChainRewards({
  group,
  formatUsd,
  collect,
  activeKey,
  isClaiming,
}: { group: LpIncentiveRewardChainGroup; formatUsd: (value: number) => string } & CollectControls): JSX.Element {
  const { t } = useTranslation()
  const { key, onCollectAll, showCollectAll } = useCollectAllForChain(group, collect)

  return (
    <Flex gap="$gap16">
      <Flex gap="$gap8">
        {group.rows.map((row) => (
          <RewardTokenRow
            key={`${row.token.chainId}:${row.token.address}`}
            row={row}
            formatUsd={formatUsd}
            collect={collect}
            activeKey={activeKey}
            isClaiming={isClaiming}
          />
        ))}
      </Flex>
      {showCollectAll && (
        <Flex row>
          <Button
            size="large"
            emphasis="primary"
            loading={activeKey === key}
            disabled={isClaiming && activeKey !== key}
            onPress={onCollectAll}
          >
            {t('pool.incentives.collectAll')}
          </Button>
        </Flex>
      )}
    </Flex>
  )
}

function RewardsLoader(): JSX.Element {
  return (
    <Skeleton>
      <Flex gap="$gap12">
        <Flex height={20} width={120} borderRadius="$rounded8" backgroundColor="$surface3" />
        <Flex height={44} borderRadius="$rounded12" backgroundColor="$surface3" />
        <Flex height={44} borderRadius="$rounded12" backgroundColor="$surface3" />
      </Flex>
    </Skeleton>
  )
}

// Wallet-level "Your rewards" modal: aggregate USD total + per-chain groups of reward tokens,
// each with a Collect / Collect all action (single-chain claims, one at a time).
export function LpIncentivesRewardsModal({
  isOpen,
  onClose,
  walletAddress,
}: LpIncentivesRewardsModalProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { totalUsd, groups, isLoading, isError, hasRewards } = useLpIncentiveRewards(walletAddress)
  const { collect, activeKey, isClaiming, error, clearError } = useCollectLpRewards()

  const formatUsd = (value: number): string => convertFiatAmountFormatted(value, NumberType.PortfolioBalance)

  // This hook stays mounted with the Positions page regardless of `isOpen`, so a failed claim's
  // error would otherwise linger and re-show on reopen. An in-flight claim is intentionally kept.
  useEffect(() => {
    if (!isOpen) {
      clearError()
    }
  }, [isOpen, clearError])

  return (
    <Modal
      name={ModalName.LpIncentivesRewards}
      isModalOpen={isOpen}
      onClose={onClose}
      alignment="center"
      maxWidth={420}
      padding="$spacing24"
    >
      <Flex gap="$gap16">
        <Flex row alignItems="center" justifyContent="space-between">
          <Text variant="subheading1" color="$neutral1">
            {t('pool.incentives.yourRewards')}
          </Text>
          <TouchableArea
            alignItems="center"
            justifyContent="center"
            onPress={onClose}
            testID="LpIncentivesRewardsModal-close"
          >
            <X size="$icon.24" color="$neutral2" hoverColor="$neutral1" />
          </TouchableArea>
        </Flex>
        {/* The total is hidden outright while loading and on a failed fetch — rendering
            formatUsd(0) in either case flashes an authoritative "$0.00" the wallet may not have. */}
        {!isError && (
          <Flex gap="$gap4">
            <Text variant="body3" color="$neutral2">
              {t('pool.incentives.rewardsEarned')}
            </Text>
            {isLoading ? (
              <Skeleton>
                <Flex height={30} width={120} borderRadius="$rounded8" backgroundColor="$surface3" />
              </Skeleton>
            ) : (
              <Text variant="heading2" color="$neutral1">
                {formatUsd(totalUsd)}
              </Text>
            )}
          </Flex>
        )}
        {error && (
          <Text variant="body3" color="$statusCritical">
            {t('pool.incentives.collectFailed')}
          </Text>
        )}
        {isError ? (
          // A failed fetch means the balance is unknown; saying "no rewards to collect" would tell a
          // wallet that has rewards that it doesn't.
          <Flex gap="$gap4">
            <Text variant="body2" color="$neutral1">
              {t('pool.incentives.yourRewards.error')}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('pool.incentives.yourRewards.error.description')}
            </Text>
          </Flex>
        ) : isLoading ? (
          <RewardsLoader />
        ) : !hasRewards ? (
          <Text variant="body2" color="$neutral2">
            {t('pool.incentives.noRewards')}
          </Text>
        ) : groups.length === 1 ? (
          <SingleChainRewards
            group={groups[0]}
            formatUsd={formatUsd}
            collect={collect}
            activeKey={activeKey}
            isClaiming={isClaiming}
          />
        ) : (
          <Flex gap="$gap16">
            {groups.map((group) => (
              <RewardChainGroup
                key={group.chainId}
                group={group}
                formatUsd={formatUsd}
                collect={collect}
                activeKey={activeKey}
                isClaiming={isClaiming}
              />
            ))}
          </Flex>
        )}
      </Flex>
    </Modal>
  )
}
