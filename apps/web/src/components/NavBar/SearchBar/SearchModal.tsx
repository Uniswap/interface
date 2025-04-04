import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, isWeb, useMedia, useScrollbarStyles, useSporeColors } from 'ui/src'
import { useFilterCallbacks } from 'uniswap/src/components/TokenSelector/hooks/useFilterCallbacks'
import { OnSelectCurrency, TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SearchModalNoQueryList } from 'uniswap/src/features/search/SearchModal/SearchModalNoQueryList'
import { SearchModalResultsList } from 'uniswap/src/features/search/SearchModal/SearchModalResultsList'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { useDebounce } from 'utilities/src/time/timing'

interface SearchModalProps {
  isModalOpen: boolean
  flow: TokenSelectorFlow
  chainId?: UniverseChainId
  chainIds?: UniverseChainId[]
  onClose: () => void
  onSelectChain?: (chainId: UniverseChainId | null) => void
  onSelectCurrency: OnSelectCurrency
}

// TODO(WEB-6764): completely WIP, just trying to instantiate a modal
export const SearchModal = memo(function _SearchModal({
  isModalOpen,
  flow,
  chainId,
  chainIds,
  onClose,
  onSelectChain,
  onSelectCurrency,
}: SearchModalProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const media = useMedia()
  const scrollbarStyles = useScrollbarStyles()

  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter, parsedChainFilter, parsedSearchFilter } =
    useFilterCallbacks(chainId ?? null, flow)
  const debouncedSearchFilter = useDebounce(searchFilter)
  const debouncedParsedSearchFilter = useDebounce(parsedSearchFilter)

  const { chains: enabledChains, isTestnetModeEnabled } = useEnabledChains()

  return (
    <Modal
      extendOnKeyboardVisible
      fullScreen
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      renderBehindBottomInset
      backgroundColor={colors.surface1.val}
      isModalOpen={isModalOpen}
      maxWidth={640}
      maxHeight={520}
      name={ModalName.Search}
      padding="$none"
      height="100vh"
      onClose={onClose}
    >
      <Flex grow gap="$spacing8" style={scrollbarStyles}>
        <Flex px="$spacing16" py="$spacing4">
          <SearchTextInput
            autoFocus={isWeb && !media.sm}
            backgroundColor="$surface2"
            endAdornment={
              <Flex row alignItems="center">
                <NetworkFilter
                  includeAllNetworks={!isTestnetModeEnabled}
                  chainIds={chainIds || enabledChains}
                  selectedChain={chainFilter}
                  onDismiss={dismissNativeKeyboard}
                  onPressChain={(newChainId) => {
                    onChangeChainFilter(newChainId)
                    onSelectChain?.(newChainId)
                  }}
                />
              </Flex>
            }
            placeholder={t('tokens.selector.search.placeholder')}
            px="$spacing16"
            py="$none"
            value={searchFilter ?? ''}
            onChangeText={onChangeText}
          />
        </Flex>
        <Flex grow>
          {searchFilter && searchFilter.length > 0 ? (
            <SearchModalResultsList
              chainFilter={chainFilter}
              debouncedParsedSearchFilter={debouncedParsedSearchFilter}
              debouncedSearchFilter={debouncedSearchFilter}
              parsedChainFilter={parsedChainFilter}
              searchFilter={searchFilter ?? ''}
              onSelectCurrency={onSelectCurrency}
            />
          ) : (
            <SearchModalNoQueryList chainFilter={chainFilter} onSelectCurrency={onSelectCurrency} />
          )}
        </Flex>
      </Flex>
    </Modal>
  )
})
