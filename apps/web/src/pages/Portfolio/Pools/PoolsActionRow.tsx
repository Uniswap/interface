import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, useMedia } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { PositionsHeader } from '~/features/Liquidity/PositionsHeader'
import { SearchInput } from '~/pages/Portfolio/components/SearchInput'

interface PoolsActionRowProps {
  search: string
  selectedStatus: PositionStatus[]
  selectedVersions: ProtocolVersion[]
  createPositionEntryPoint: string
  showCreateButton?: boolean
  onSearchChange: (search: string) => void
  onStatusChange: (status: PositionStatus) => void
  onVersionChange: (version: ProtocolVersion) => void
}

export function PoolsActionRow({
  search,
  selectedStatus,
  selectedVersions,
  createPositionEntryPoint,
  showCreateButton = true,
  onSearchChange,
  onStatusChange,
  onVersionChange,
}: PoolsActionRowProps): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const handlePortfolioChainChange = useCallback(() => undefined, [])

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      alignSelf="stretch"
      gap="$spacing16"
      $md={{ flexDirection: 'column', alignItems: 'stretch' }}
    >
      <PositionsHeader
        showTitle={false}
        showNetworkFilter={false}
        showCreateButton={showCreateButton}
        stackControlsAt="md"
        selectedChain={null}
        selectedVersions={selectedVersions}
        selectedStatus={selectedStatus}
        onChainChange={handlePortfolioChainChange}
        onVersionChange={onVersionChange}
        onStatusChange={onStatusChange}
        createPositionEntryPoint={createPositionEntryPoint}
      />
      <SearchInput
        value={search}
        onChangeText={onSearchChange}
        dataTestId={TestID.PortfolioPoolsSearchInput}
        placeholder={t('tokens.table.search.placeholder.pools')}
        width={media.md ? '100%' : media.xl ? 280 : 360}
      />
    </Flex>
  )
}
