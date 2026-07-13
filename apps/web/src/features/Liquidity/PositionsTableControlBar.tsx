import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useTranslation } from 'react-i18next'
import { Flex, Switch, Text, TouchableArea } from 'ui/src'
import { Search } from 'ui/src/components/icons/Search'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ProtocolFilterDropdown, PositionsNetworkFilter } from '~/features/Liquidity/positionsFilters'
import { PositionsStatusChips } from '~/features/Liquidity/PositionsStatusChips'
import { warnNotImplemented } from '~/features/Liquidity/positionsV2Stub'

export interface PositionsTableControlBarProps {
  statusFilter: PositionStatus[]
  setStatusFilter: (statuses: PositionStatus[]) => void
  versionFilter: ProtocolVersion[]
  toggleVersion: (version: ProtocolVersion) => void
  chainFilter: UniverseChainId | null
  setChainFilter: (chain: UniverseChainId | null) => void
  showNetworkFilter?: boolean
}

export function PositionsTableControlBar({
  statusFilter,
  setStatusFilter,
  versionFilter,
  toggleVersion,
  chainFilter,
  setChainFilter,
  showNetworkFilter = true,
}: PositionsTableControlBarProps): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      gap="$spacing8"
      $sm={{ row: false, alignItems: 'stretch' }}
    >
      <PositionsStatusChips statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <Flex row alignItems="center" gap="$spacing8">
        <GroupByPoolToggle />
        {showNetworkFilter && <PositionsNetworkFilter selectedChain={chainFilter} onChainChange={setChainFilter} />}
        <ProtocolFilterDropdown selectedVersions={versionFilter} onToggleVersion={toggleVersion} />
        <SearchButton onPress={() => warnNotImplemented('search')} />
      </Flex>
    </Flex>
  )
}

function SearchButton({ onPress }: { onPress: () => void }): JSX.Element {
  return (
    <TouchableArea
      hoverable
      onPress={onPress}
      borderWidth={1}
      borderColor="$surface3"
      borderRadius="$rounded12"
      p="$spacing8"
    >
      <Search color="$neutral2" size={20} />
    </TouchableArea>
  )
}

function GroupByPoolToggle(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing8"
      borderWidth={1}
      borderColor="$surface3"
      borderRadius="$roundedFull"
      px="$spacing12"
      py="$spacing4"
    >
      <Text variant="buttonLabel3" color="$neutral2">
        {t('liquidityPool.positions.groupByPool')}
      </Text>
      <Switch variant="branded" checked={false} onCheckedChange={() => warnNotImplemented('group_by_pool')} />
    </Flex>
  )
}
