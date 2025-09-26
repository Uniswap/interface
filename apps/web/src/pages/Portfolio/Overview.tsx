import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell, TableText } from 'components/Table/styled'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'

// Sample data type
interface SampleData {
  id: string
  name: string
  value: string
  status: string
}

// Sample data
const sampleData: SampleData[] = [
  { id: '1', name: 'Ethereum', value: '$2,450.00', status: 'Active' },
  { id: '2', name: 'USDC', value: '$1,200.00', status: 'Active' },
  { id: '3', name: 'UNI', value: '$850.00', status: 'Active' },
  { id: '4', name: 'WETH', value: '$3,100.00', status: 'Active' },
]

export default function PortfolioOverview() {
  const { t } = useTranslation()

  // Create table columns
  const columnHelper = createColumnHelper<SampleData>()
  const columns = [
    columnHelper.accessor('name', {
      header: () => (
        <HeaderCell justifyContent="flex-start">
          <Text variant="body3" color="$neutral2" fontWeight="500">
            Asset
          </Text>
        </HeaderCell>
      ),
      cell: (info) => (
        <Cell justifyContent="flex-start">
          <TableText>{info.getValue()}</TableText>
        </Cell>
      ),
    }),
    columnHelper.accessor('value', {
      header: () => (
        <HeaderCell justifyContent="flex-end">
          <Text variant="body3" color="$neutral2" fontWeight="500">
            Value
          </Text>
        </HeaderCell>
      ),
      cell: (info) => (
        <Cell justifyContent="flex-end">
          <TableText>{info.getValue()}</TableText>
        </Cell>
      ),
    }),
    columnHelper.accessor('status', {
      header: () => (
        <HeaderCell justifyContent="center">
          <Text variant="body3" color="$neutral2" fontWeight="500">
            Status
          </Text>
        </HeaderCell>
      ),
      cell: (info) => (
        <Cell justifyContent="center">
          <TableText>{info.getValue()}</TableText>
        </Cell>
      ),
    }),
  ]

  return (
    <Trace logImpression page={InterfacePageName.PortfolioOverviewPage}>
      <Flex gap="$spacing16">
        <Text variant="heading2">{t('portfolio.overview.title')}</Text>

        {/* Basic Table */}
        <Flex flexDirection="column" gap="$spacing12">
          <Text variant="subheading1">Portfolio Assets</Text>
          <Table columns={columns} data={sampleData} loading={false} error={false} v2={true} />
        </Flex>
      </Flex>
    </Trace>
  )
}
