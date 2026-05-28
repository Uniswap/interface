import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ElementName, InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExpandableSearchInput } from '~/components/ExpandableSearchInput/ExpandableSearchInput'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { useDebounce } from '~/hooks/useDebounce'
import { ExploreTab } from '~/types/explore'

export function SearchBar({ tab }: { tab?: string }) {
  const { t } = useTranslation()
  const currentString = useExploreTablesFilterStore((s) => s.filterString)
  const [localFilterString, setLocalFilterString] = useState(currentString)
  const { setFilterString } = useExploreTablesFilterStoreActions()
  const debouncedLocalFilterString = useDebounce(localFilterString, 300)
  const [isOpen, setIsOpen] = useState(false)
  useEffect(() => {
    setLocalFilterString(currentString)
    if (currentString) {
      setIsOpen(true)
    }
  }, [currentString])

  useEffect(() => {
    setFilterString(debouncedLocalFilterString)
  }, [debouncedLocalFilterString, setFilterString])

  const placeholdersText: Record<string, string> = {
    [ExploreTab.Tokens]: t('tokens.table.search.placeholder.tokens'),
    [ExploreTab.Pools]: t('tokens.table.search.placeholder.pools'),
    [ExploreTab.Transactions]: t('tokens.table.search.placeholder.transactions'),
    [ExploreTab.Toucan]: t('auctions.table.search.placeholder'),
  }

  return (
    <Trace logFocus eventOnTrigger={InterfaceEventName.ExploreSearchSelected} element={ElementName.ExploreSearchInput}>
      <ExpandableSearchInput
        data-testid="explore-tokens-search-input"
        value={localFilterString}
        onChangeText={setLocalFilterString}
        placeholder={placeholdersText[tab ?? ExploreTab.Tokens]}
        isOpen={isOpen}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          if (localFilterString === '') {
            setIsOpen(false)
          }
        }}
        onClose={() => {
          setIsOpen(false)
          setLocalFilterString('')
        }}
        responsive
      />
    </Trace>
  )
}
