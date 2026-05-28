import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { atom, useAtom } from 'jotai'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DEFAULT_LP_POSITION_PROTOCOL_FILTER, DEFAULT_LP_POSITION_STATUS_FILTER } from '~/features/Liquidity/constants'

const chainFilterAtom = atom<UniverseChainId | null>(null)
const versionFilterAtom = atom<ProtocolVersion[]>([...DEFAULT_LP_POSITION_PROTOCOL_FILTER])
const statusFilterAtom = atom<PositionStatus[]>([...DEFAULT_LP_POSITION_STATUS_FILTER])

export interface UsePositionFiltersResult {
  chainFilter: UniverseChainId | null
  setChainFilter: (id: UniverseChainId | null) => void
  versionFilter: ProtocolVersion[]
  toggleVersion: (version: ProtocolVersion) => void
  statusFilter: PositionStatus[]
  toggleStatus: (status: PositionStatus) => void
}

export function usePositionFilters(): UsePositionFiltersResult {
  const [chainFilter, setChainFilter] = useAtom(chainFilterAtom)
  const [versionFilter, setVersionFilter] = useAtom(versionFilterAtom)
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom)

  const toggleVersion = (version: ProtocolVersion) => {
    setVersionFilter((prev) => (prev.includes(version) ? prev.filter((v) => v !== version) : [...prev, version]))
  }

  const toggleStatus = (status: PositionStatus) => {
    setStatusFilter((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  return {
    chainFilter,
    setChainFilter,
    versionFilter,
    toggleVersion,
    statusFilter,
    toggleStatus,
  }
}
