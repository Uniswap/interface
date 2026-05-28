import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell, StyledExternalLink, TableText } from 'components/Table/styled'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useMedia } from 'ui/src'
import { GqlChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, fromUniswapWebAppLink } from 'uniswap/src/features/chains/utils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

type InviteRebateItem = {
  id: string
  txHash: string
  inviteeAddress?: string
  chain?: string
  volumeUSD: number
  inviteRebatePoints: number
  createdAt: string
  timestamp?: number
}

function shortenHash(hash: string): string {
  if (!hash) {
    return ''
  }
  if (hash.length <= 12) {
    return hash
  }
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

function shortenAddress(address: string): string {
  if (!address) {
    return ''
  }
  if (address.length <= 12) {
    return address
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatTimestamp(value: string): string {
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
  if (value > 0 && value < 0.01) {
    return '< 0.01'
  }
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function normalizeChainName(value?: string): string {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '') ?? ''
  )
}

function getChainIdFromReferralChain(chain?: string): UniverseChainId | undefined {
  if (!chain) {
    return undefined
  }

  const directMatch = fromGraphQLChain(chain as GqlChainId)
  if (directMatch) {
    return directMatch
  }

  const normalizedChain = normalizeChainName(chain)
  const aliasToWebAppLink: Record<string, string> = {
    mainnet: 'ethereum',
    sepolia: 'ethereumsepolia',
    hyperevm: 'hyper',
    monad: 'monadtestnet',
    astrochain: 'astrochainsepolia',
  }

  try {
    return fromUniswapWebAppLink(aliasToWebAppLink[normalizedChain] ?? normalizedChain) ?? undefined
  } catch {
    return undefined
  }
}

function getTxLink(item?: InviteRebateItem): string | undefined {
  if (!item?.chain || !item.txHash) {
    return undefined
  }
  const chainId = getChainIdFromReferralChain(item.chain)
  if (!chainId) {
    return undefined
  }
  return getExplorerLink(chainId, item.txHash, ExplorerDataType.TRANSACTION)
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

export function InviteRebatesTable({
  data,
  loading,
  page,
  pageCount,
  total,
  onPageChange,
}: {
  data: InviteRebateItem[]
  loading: boolean
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const isMobile = media.md

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<InviteRebateItem>()

    return [
      columnHelper.accessor((row) => row.createdAt, {
        id: 'timestamp',
        size: 160,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2">
              {t('referral.transactionList.timestamp', 'Time')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading} justifyContent="flex-start">
            <TableText>{formatTimestamp(row.getValue?.() ?? '')}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.volumeUSD, {
        id: 'volumeUSD',
        size: 140,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.table.volumeUsd')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>${formatNumber(row.getValue?.())}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.inviteRebatePoints, {
        id: 'points',
        size: 120,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.table.points')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>{formatPoints(row.getValue?.())}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.inviteeAddress, {
        id: 'address',
        size: 140,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.table.address')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>{shortenAddress(row.getValue?.() ?? '')}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.txHash, {
        id: 'tx',
        size: 120,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.table.tx')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            {getTxLink(row.row?.original) ? (
              <StyledExternalLink href={getTxLink(row.row?.original)} target="_blank" rel="noopener noreferrer">
                <Text variant="body3" color="$accent1">
                  {shortenHash(row.getValue?.() ?? '')}
                </Text>
              </StyledExternalLink>
            ) : (
              <TableText>{shortenHash(row.getValue?.() ?? '')}</TableText>
            )}
          </Cell>
        ),
      }),
    ]
  }, [loading, t])

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
        {data.map((item, index) => (
          <Flex
            key={`${item.txHash}-${item.createdAt}-${index}`}
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
                {t('referral.table.volumeUsd')}
              </Text>
              <Text variant="body3" color="$neutral1">
                ${formatNumber(item.volumeUSD)}
              </Text>
            </Flex>
            <Flex flexDirection="column" gap="$spacing2">
              <Text variant="body4" color="$neutral2">
                {t('referral.table.points')}
              </Text>
              <Text variant="body3" color="$neutral1">
                {formatPoints(item.inviteRebatePoints)}
              </Text>
            </Flex>
            <Flex flexDirection="column" gap="$spacing2">
              <Text variant="body4" color="$neutral2">
                {t('referral.table.address')}
              </Text>
              <Text variant="body3" color="$neutral1">
                {shortenAddress(item.inviteeAddress ?? '')}
              </Text>
            </Flex>
            <Flex flexDirection="column" gap="$spacing2">
              <Text variant="body4" color="$neutral2">
                {t('referral.table.tx')}
              </Text>
              {getTxLink(item) ? (
                <StyledExternalLink href={getTxLink(item)} target="_blank" rel="noopener noreferrer">
                  <Text variant="body3" color="$accent1">
                    {shortenHash(item.txHash)}
                  </Text>
                </StyledExternalLink>
              ) : (
                <Text variant="body3" color="$neutral1">
                  {shortenHash(item.txHash)}
                </Text>
              )}
            </Flex>
          </Flex>
        ))}
        <Pagination page={page} pageCount={pageCount} total={total} onPageChange={onPageChange} />
      </Flex>
    )
  }

  return (
    <Flex flexDirection="column">
      <Table columns={columns} data={data} />
      <Pagination page={page} pageCount={pageCount} total={total} onPageChange={onPageChange} />
    </Flex>
  )
}
