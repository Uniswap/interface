import { createColumnHelper } from '@tanstack/react-table'
import { Dialog } from 'components/Dialog/Dialog'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell, TableText } from 'components/Table/styled'
import { useAccount } from 'hooks/useAccount'
import {
  fetchReferralClaimParams,
  multiMerkleDistributorWithDeadlineAbi,
  useReferralActivityClaim,
} from 'pages/Referral/hooks/useReferralActivityClaim'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useMedia } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContracts } from 'wagmi'

export type UserReferralActivityItem = {
  id: string
  claimActivityId?: string
  createdAt: string
  activityName: string
  swapPoints: number
  invitePoints: number
  totalPoints: number
  rewardUsd: number
  claimable?: boolean
  claimed?: boolean
  claimUrl?: string
  merkleRoot?: string
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '--'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

function formatNumber(value: number | undefined, digits = 2): string {
  if (value === null || value === undefined) {
    return '0'
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value)
}

function formatPoints(value: number | undefined): string {
  if (value === null || value === undefined) {
    return '0.00'
  }
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function extractErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return ''
  }

  const maybeError = error as {
    message?: unknown
    reason?: unknown
    shortMessage?: unknown
    error?: unknown
    data?: { message?: unknown; originalError?: unknown } | unknown
  }

  const candidates = [maybeError.shortMessage, maybeError.reason, maybeError.message]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  const nested = maybeError.error ?? (typeof maybeError.data === 'object' ? maybeError.data : undefined)
  if (nested && nested !== error) {
    return extractErrorMessage(nested)
  }

  return ''
}

function cleanErrorMessage(rawMessage: string): string {
  if (!rawMessage) {
    return ''
  }

  let message = rawMessage
    .replace(/\s*See:\s*https?:\/\/links\.ethers\.org\/v5-errors-[^\s]+/gi, '')
    .replace(/\\n/g, '\n')
    .replace(/\n\s*at\s+.+/gis, '')
    .replace(/chrome-extension:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (message.startsWith('execution reverted:')) {
    message = message.replace(/^execution reverted:\s*/i, '')
  }

  if (message.length > 180) {
    message = `${message.slice(0, 180).trim()}...`
  }

  return message
}

function isClaimNotAvailableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : ''
  return msg.startsWith('CLAIM_NOT_AVAILABLE:')
}

function formatClaimErrorMessage(t: ReturnType<typeof useTranslation>['t'], error: unknown): string {
  if (didUserReject(error)) {
    return t('swap.error.rejected', 'Transaction rejected')
  }

  if (isClaimNotAvailableError(error)) {
    return t(
      'referral.activities.claimUnavailableModal.description',
      'Current activity rewards are not open for claiming yet.',
    )
  }

  const rawMessage = extractErrorMessage(error)
  const normalized = rawMessage.toLowerCase()

  if (normalized.includes('unpredictable_gas_limit')) {
    return t('referral.claim.error.unpredictableGas', 'Claim is currently unavailable for this activity')
  }
  if (normalized.includes('already claimed') || normalized.includes('claimed')) {
    return t('common.claimed', 'Claimed')
  }
  if (normalized.includes('insufficient funds')) {
    return t('swap.error.insufficientFunds', 'Insufficient funds for network fee')
  }
  if (normalized.includes('failed to fetch claim params: http 400')) {
    return t('referral.claim.error.invalidParams', 'Claim parameters are invalid, please refresh and try again')
  }
  if (normalized.includes('wallet not connected')) {
    return t('common.connectWallet.button', 'Connect Wallet')
  }
  if (normalized.includes('failed to switch to sepolia') || normalized.includes('unsupported chain')) {
    return t('network.unsupported', 'Please switch network to Sepolia')
  }

  const cleaned = cleanErrorMessage(rawMessage)
  if (cleaned) {
    return cleaned
  }

  return t('common.error.generic', 'Something went wrong')
}

function Pagination({
  page,
  pageCount,
  total,
  onPageChange,
}: {
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation()
  if (total === 0) {
    return null
  }
  return (
    <Flex row justifyContent="flex-end" alignItems="center" gap="$spacing12" pt="$spacing16">
      <Text variant="body3" color="$neutral2">
        {t('referral.table.totalCount', { total })}
      </Text>
      <Flex row gap="$spacing8" alignItems="center">
        <Button size="small" emphasis="secondary" isDisabled={page <= 1} onPress={() => onPageChange(page - 1)}>
          {t('referral.table.previousPage')}
        </Button>
        <Text variant="body3" color="$neutral1">
          {page} / {Math.max(1, pageCount)}
        </Text>
        <Button size="small" emphasis="secondary" isDisabled={page >= pageCount} onPress={() => onPageChange(page + 1)}>
          {t('referral.table.nextPage')}
        </Button>
      </Flex>
    </Flex>
  )
}

export function UserReferralActivitiesTable({
  data,
  loading,
  page,
  pageCount,
  total,
  onPageChange,
  onClaimed,
}: {
  data: UserReferralActivityItem[]
  loading: boolean
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
  onClaimed?: (itemId: string, txHash?: string) => void
}) {
  const { t } = useTranslation()
  const account = useAccount()
  const claimReferralActivity = useReferralActivityClaim()
  const media = useMedia()
  const isMobile = media.md
  const [claimErrorMessage, setClaimErrorMessage] = useState('')
  const [claimDialogIsInfo, setClaimDialogIsInfo] = useState(false)
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null)
  const [claimParamsByItemId, setClaimParamsByItemId] = useState<
    Record<string, { campaignId: string; index: string; distributorAddress: string; claimParamsUrl?: string }>
  >({})

  useEffect(() => {
    let cancelled = false

    const fetchClaimParamsForItems = async () => {
      if (!account.address) {
        setClaimParamsByItemId({})
        return
      }
      const accountAddress = account.address

      const candidateItems = data.filter((item) => item.claimable && !item.claimed)
      if (!candidateItems.length) {
        setClaimParamsByItemId({})
        return
      }

      const settled = await Promise.allSettled(
        candidateItems.map(async (item) => {
          const claimActivityId = item.claimActivityId ?? item.id
          const params = await fetchReferralClaimParams({
            address: accountAddress,
            activityId: claimActivityId,
            claimParamsUrl: item.claimUrl,
          })
          return {
            itemId: item.id,
            campaignId: params.campaignId,
            index: params.index,
            distributorAddress: params.distributorAddress,
            claimParamsUrl: item.claimUrl,
          }
        }),
      )

      if (cancelled) {
        return
      }

      const nextClaimParamsByItemId: Record<
        string,
        { campaignId: string; index: string; distributorAddress: string; claimParamsUrl?: string }
      > = {}
      for (const result of settled) {
        if (result.status !== 'fulfilled') {
          continue
        }
        nextClaimParamsByItemId[result.value.itemId] = {
          campaignId: result.value.campaignId,
          index: result.value.index,
          distributorAddress: result.value.distributorAddress,
          claimParamsUrl: result.value.claimParamsUrl,
        }
      }

      setClaimParamsByItemId(nextClaimParamsByItemId)
    }

    fetchClaimParamsForItems()

    return () => {
      cancelled = true
    }
  }, [account.address, data])

  const chainClaimStatusItems = useMemo(
    () =>
      data.filter((item) => {
        const claimParams = claimParamsByItemId[item.id]
        return Boolean(claimParams && item.claimable && !item.claimed)
      }),
    [claimParamsByItemId, data],
  )

  const { data: chainClaimStatusResults } = useReadContracts({
    contracts: chainClaimStatusItems.map((item) => {
      const claimParams = claimParamsByItemId[item.id]
      return {
        address: assume0xAddress(claimParams?.distributorAddress),
        chainId: UniverseChainId.Base,
        abi: multiMerkleDistributorWithDeadlineAbi,
        functionName: 'isClaimed' as const,
        args: [BigInt(claimParams?.campaignId ?? '0'), BigInt(claimParams?.index ?? '0')] as const,
      }
    }),
    query: { enabled: chainClaimStatusItems.length > 0 },
  })

  const chainClaimedItemIds = useMemo(() => {
    const claimedIds = new Set<string>()
    if (!chainClaimStatusResults?.length) {
      return claimedIds
    }

    for (let index = 0; index < chainClaimStatusResults.length; index++) {
      const result = chainClaimStatusResults[index]
      const item = chainClaimStatusItems[index]
      if (result?.status === 'success' && result.result === true && item) {
        claimedIds.add(item.id)
      }
    }
    return claimedIds
  }, [chainClaimStatusItems, chainClaimStatusResults])

  useEffect(() => {
    chainClaimedItemIds.forEach((itemId) => {
      onClaimed?.(itemId)
    })
  }, [chainClaimedItemIds, onClaimed])

  const handleClaimPress = useCallback(
    async (item?: UserReferralActivityItem): Promise<void> => {
      if (!item || item.claimed) {
        return
      }

      if (chainClaimedItemIds.has(item.id)) {
        onClaimed?.(item.id)
        return
      }

      if (!account.address) {
        setClaimErrorMessage(t('common.connectWallet.button', 'Connect Wallet'))
        return
      }

      setClaimingItemId(item.id)
      setClaimErrorMessage('')

      try {
        const txHash = await claimReferralActivity({
          activityId: item.claimActivityId ?? item.id,
          claimParamsUrl: item.claimUrl,
        })
        onClaimed?.(item.id, txHash)
      } catch (error) {
        setClaimDialogIsInfo(isClaimNotAvailableError(error))
        setClaimErrorMessage(formatClaimErrorMessage(t, error))
      } finally {
        setClaimingItemId(null)
      }
    },
    [account.address, chainClaimedItemIds, claimReferralActivity, onClaimed, t],
  )

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<UserReferralActivityItem>()

    return [
      columnHelper.accessor((row) => row.createdAt, {
        id: 'createdAt',
        size: 180,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2">
              {t('referral.transactionList.timestamp', 'Time')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading} justifyContent="flex-start">
            <TableText>{formatTimestamp(row.getValue?.())}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.activityName, {
        id: 'activityName',
        size: 220,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2">
              {t('referral.activities.activityName', 'Activity')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading} justifyContent="flex-start">
            <TableText>{row.getValue?.() || '--'}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.swapPoints, {
        id: 'swapPoints',
        size: 130,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.activities.swapPoints', 'Swap Points')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>{formatPoints(row.getValue?.())}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.invitePoints, {
        id: 'invitePoints',
        size: 130,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.activities.invitePoints', 'Invite Points')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>{formatPoints(row.getValue?.())}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.totalPoints, {
        id: 'totalPoints',
        size: 130,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.totalPointsLabel', 'Total Points')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>{formatPoints(row.getValue?.())}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.rewardUsd, {
        id: 'rewardUsd',
        size: 120,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.rewardsLabel', 'Reward')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>${formatNumber(row.getValue?.())}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row, {
        id: 'claim',
        size: 120,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.activities.claim', 'Claim')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => {
          const item = row.getValue?.()
          const isClaimed = Boolean(item?.claimed || (item && chainClaimedItemIds.has(item.id)))
          return (
            <Cell loading={loading}>
              <Button
                size="xsmall"
                emphasis="secondary"
                maxWidth="fit-content"
                isDisabled={Boolean(isClaimed || !item?.claimable || claimingItemId === item?.id)}
                onPress={() => handleClaimPress(item)}
              >
                {isClaimed
                  ? t('common.claimed', 'Claimed')
                  : claimingItemId === item?.id
                    ? t('common.loading', 'Loading')
                    : t('referral.claimButton', 'Claim')}
              </Button>
            </Cell>
          )
        },
      }),
    ]
  }, [chainClaimedItemIds, claimingItemId, handleClaimPress, loading, t])

  if (isMobile) {
    if (loading) {
      return (
        <Flex p="$spacing16" justifyContent="center" alignItems="center">
          <Text variant="body3" color="$neutral2">
            {t('common.loading')}
          </Text>
        </Flex>
      )
    }

    if (!data.length) {
      return (
        <Flex p="$spacing16" justifyContent="center" alignItems="center">
          <Text variant="body3" color="$neutral2">
            {t('common.noData')}
          </Text>
        </Flex>
      )
    }

    return (
      <Flex flexDirection="column" gap="$spacing8" width="100%">
        {data.map((item, index) => {
          const isClaimed = Boolean(item.claimed || chainClaimedItemIds.has(item.id))
          return (
            <Flex
              key={`${item.id}-${index}`}
              p="$spacing12"
              borderRadius="$rounded12"
              borderWidth={1}
              borderColor="$surface3"
              backgroundColor="$surface2"
              gap="$spacing8"
            >
              <Flex flexDirection="column" gap="$spacing2">
                <Text variant="body4" color="$neutral2">
                  {t('referral.transactionList.timestamp', 'Time')}
                </Text>
                <Text variant="body3" color="$neutral1">
                  {formatTimestamp(item.createdAt)}
                </Text>
              </Flex>
              <Flex flexDirection="column" gap="$spacing2">
                <Text variant="body4" color="$neutral2">
                  {t('referral.activities.activityName', 'Activity')}
                </Text>
                <Text variant="body3" color="$neutral1">
                  {item.activityName || '--'}
                </Text>
              </Flex>
              <Flex row gap="$spacing16" flexWrap="wrap">
                <Flex flexDirection="column" gap="$spacing2">
                  <Text variant="body4" color="$neutral2">
                    {t('referral.activities.swapPoints', 'Swap Points')}
                  </Text>
                  <Text variant="body3" color="$neutral1">
                    {formatPoints(item.swapPoints)}
                  </Text>
                </Flex>
                <Flex flexDirection="column" gap="$spacing2">
                  <Text variant="body4" color="$neutral2">
                    {t('referral.activities.invitePoints', 'Invite Points')}
                  </Text>
                  <Text variant="body3" color="$neutral1">
                    {formatPoints(item.invitePoints)}
                  </Text>
                </Flex>
                <Flex flexDirection="column" gap="$spacing2">
                  <Text variant="body4" color="$neutral2">
                    {t('referral.totalPointsLabel', 'Total Points')}
                  </Text>
                  <Text variant="body3" color="$neutral1">
                    {formatPoints(item.totalPoints)}
                  </Text>
                </Flex>
                <Flex flexDirection="column" gap="$spacing2">
                  <Text variant="body4" color="$neutral2">
                    {t('referral.rewardsLabel', 'Reward')}
                  </Text>
                  <Text variant="body3" color="$neutral1">
                    ${formatNumber(item.rewardUsd)}
                  </Text>
                </Flex>
              </Flex>
              <Flex>
                <Button
                  size="xxsmall"
                  emphasis="secondary"
                  maxWidth="fit-content"
                  alignSelf="flex-start"
                  isDisabled={Boolean(isClaimed || !item.claimable || claimingItemId === item.id)}
                  onPress={() => handleClaimPress(item)}
                >
                  {isClaimed
                    ? t('common.claimed', 'Claimed')
                    : claimingItemId === item.id
                      ? t('common.loading', 'Loading')
                      : t('referral.claimButton', 'Claim')}
                </Button>
              </Flex>
            </Flex>
          )
        })}
        <Pagination page={page} pageCount={pageCount} total={total} onPageChange={onPageChange} />
      </Flex>
    )
  }

  return (
    <>
      <Dialog
        isOpen={Boolean(claimErrorMessage)}
        onClose={() => {
          setClaimErrorMessage('')
          setClaimDialogIsInfo(false)
        }}
        icon={<AlertCircle size={20} color="currentColor" />}
        title={
          claimDialogIsInfo
            ? t('referral.activities.claimUnavailableModal.title', 'Claim is not available yet')
            : t('referral.activities.claimFailedModal.title', 'Claim failed')
        }
        subtext={claimErrorMessage || t('common.error.generic', 'Something went wrong')}
        modalName={ModalName.Dialog}
        primaryButtonText={t('common.button.ok')}
        primaryButtonOnClick={() => {
          setClaimErrorMessage('')
          setClaimDialogIsInfo(false)
        }}
        hasIconBackground
      />
      <Flex flexDirection="column">
        <Table
          columns={columns}
          data={data}
          loading={loading}
          maxWidth={1200}
          defaultPinnedColumns={['createdAt', 'activityName']}
        />
        <Pagination page={page} pageCount={pageCount} total={total} onPageChange={onPageChange} />
      </Flex>
    </>
  )
}
