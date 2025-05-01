import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Flex, Text, TouchableArea, useMedia, useScrollbarStyles, useSporeColors } from 'ui/src'
import { useFilterCallbacks } from 'uniswap/src/components/TokenSelector/hooks/useFilterCallbacks'
import { SearchModalItemTypes, isPoolOption } from 'uniswap/src/components/lists/items/types'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useUpdateScrollLock } from 'uniswap/src/components/modals/ScrollLock'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { NATIVE_TOKEN_PLACEHOLDER } from 'uniswap/src/constants/addresses'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { SearchModalNoQueryList } from 'uniswap/src/features/search/SearchModal/SearchModalNoQueryList'
import { SearchModalResultsList } from 'uniswap/src/features/search/SearchModal/SearchModalResultsList'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { getPoolDetailsURL, getTokenDetailsURL } from 'uniswap/src/utils/linking'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useDebounce } from 'utilities/src/time/timing'

interface SearchModalProps {
  isModalOpen: boolean
  onClose: () => void
}

export const SearchModal = memo(function _SearchModal({ isModalOpen, onClose }: SearchModalProps): JSX.Element {
  const poolSearchEnabled = useFeatureFlag(FeatureFlags.PoolSearch)
  const colors = useSporeColors()
  const { t } = useTranslation()
  const media = useMedia()
  const scrollbarStyles = useScrollbarStyles()

  const [activeTab, setActiveTab] = useState<SearchTab>(poolSearchEnabled ? SearchTab.All : SearchTab.Tokens)

  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter, parsedChainFilter, parsedSearchFilter } =
    useFilterCallbacks(null, ModalName.Search)
  const debouncedSearchFilter = useDebounce(searchFilter)
  const debouncedParsedSearchFilter = useDebounce(parsedSearchFilter)

  const { chains: enabledChains } = useEnabledChains()

  const navigate = useNavigate()
  const onSelectOption = (item: SearchModalItemTypes) => {
    if (isPoolOption(item)) {
      const pdpUrl = getPoolDetailsURL(item.poolId, item.chainId)
      navigate(pdpUrl)
    } else {
      const { chainId, isNative } = item.currencyInfo.currency
      const tokenAddress = isNative ? NATIVE_TOKEN_PLACEHOLDER : item.currencyInfo.currency.address
      const tdpUrl = getTokenDetailsURL({ chain: chainId, address: tokenAddress })
      navigate(tdpUrl)
    }

    onClose()
  }

  // Tamagui Dialog/Sheets should remove background scroll by default but does not work to disable ArrowUp/Down key scrolling
  useUpdateScrollLock({ isModalOpen })

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
      <Flex grow style={scrollbarStyles}>
        <Flex
          $sm={{ px: '$spacing16', py: '$spacing4', borderColor: undefined, borderBottomWidth: 0 }}
          px="$spacing4"
          py="$spacing20"
          borderBottomColor="$surface3"
          borderBottomWidth={1}
        >
          <SearchTextInput
            autoFocus
            minHeight={media.sm ? undefined : 24}
            backgroundColor={media.sm ? '$surface2' : '$none'}
            borderColor={!media.sm ? '$none' : undefined}
            py="$none"
            endAdornment={
              <Flex row alignItems="center">
                <NetworkFilter
                  includeAllNetworks
                  chainIds={enabledChains}
                  selectedChain={chainFilter}
                  onDismiss={dismissNativeKeyboard}
                  onPressChain={onChangeChainFilter}
                />
              </Flex>
            }
            placeholder={poolSearchEnabled ? t('search.input.placeholder') : t('tokens.selector.search.placeholder')}
            px="$spacing16"
            value={searchFilter ?? ''}
            onChangeText={onChangeText}
            onKeyPress={(e) => {
              if (['Enter', 'ArrowUp', 'ArrowDown'].includes(e.nativeEvent.key)) {
                // default behaviors we don't want:
                // - 'enter' key action blurs the input field
                // - 'arrow up/down' key action moves text cursor to the start/end of the input
                e.preventDefault()
              }
            }}
          />
        </Flex>
        {poolSearchEnabled && (
          <Flex row px="$spacing20" pt="$spacing16" pb="$spacing8" gap="$spacing16">
            {Object.values(SearchTab).map((tab) => (
              <TouchableArea key={tab} onPress={() => setActiveTab(tab)}>
                <Text color={activeTab === tab ? '$neutral1' : '$neutral2'} variant="buttonLabel2">
                  {tab}
                </Text>
              </TouchableArea>
            ))}
          </Flex>
        )}
        <Flex grow>
          {searchFilter && searchFilter.length > 0 ? (
            <SearchModalResultsList
              chainFilter={chainFilter}
              debouncedParsedSearchFilter={debouncedParsedSearchFilter}
              debouncedSearchFilter={debouncedSearchFilter}
              parsedChainFilter={parsedChainFilter}
              searchFilter={searchFilter ?? ''}
              activeTab={activeTab}
              onSelect={onSelectOption}
            />
          ) : (
            <SearchModalNoQueryList chainFilter={chainFilter} activeTab={activeTab} onSelect={onSelectOption} />
          )}
        </Flex>
      </Flex>
    </Modal>
  )
})
