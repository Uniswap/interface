import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell, TableText } from 'components/Table/styled'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useMedia } from 'ui/src'

type InviteeItem = {
  id: string
  address: string
  referralCode?: string | null
  contributedPoints: number
  invitedAt?: string | null
  createdAt: string
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

export function InviteesTable({
  data,
  loading,
  page,
  pageCount,
  total,
  onPageChange,
}: {
  data: InviteeItem[]
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
    const columnHelper = createColumnHelper<InviteeItem>()

    return [
      columnHelper.accessor((row) => row.invitedAt ?? row.createdAt, {
        id: 'invitedAt',
        size: 140,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2">
              {t('referral.table.bindTime')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading} justifyContent="flex-start">
            <TableText>{formatTimestamp(row.getValue?.())}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.address, {
        id: 'address',
        size: 200,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.table.address')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>{row.getValue?.() ?? ''}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.contributedPoints, {
        id: 'contributedPoints',
        size: 160,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('referral.table.contributedPoints')}
            </Text>
          </HeaderCell>
        ),
        cell: (row) => (
          <Cell loading={loading}>
            <TableText>{formatNumber(row.getValue?.())}</TableText>
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
                {t('referral.table.bindTime')}
              </Text>
              <Text variant="body3" color="$neutral1">
                {formatTimestamp(item.invitedAt ?? item.createdAt)}
              </Text>
            </Flex>
            <Flex flexDirection="column" gap="$spacing2">
              <Text variant="body4" color="$neutral2">
                {t('referral.table.address')}
              </Text>
              <Text variant="body3" color="$neutral1">
                {item.address}
              </Text>
            </Flex>
            <Flex flexDirection="column" gap="$spacing2">
              <Text variant="body4" color="$neutral2">
                {t('referral.table.contributedPoints')}
              </Text>
              <Text variant="body3" color="$neutral1">
                {formatNumber(item.contributedPoints)}
              </Text>
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
