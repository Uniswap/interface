import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Flex, useMedia, useScrollbarStyles, useSporeColors } from 'ui/src'
import { useFilterCallbacks } from 'uniswap/src/components/TokenSelector/hooks/useFilterCallbacks'
import { SearchModalItemTypes, isPoolOption } from 'uniswap/src/components/lists/types'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { NATIVE_TOKEN_PLACEHOLDER } from 'uniswap/src/constants/addresses'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { SearchModalNoQueryList } from 'uniswap/src/features/search/SearchModal/SearchModalNoQueryList'
import { SearchModalResultsList } from 'uniswap/src/features/search/SearchModal/SearchModalResultsList'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { getPoolDetailsURL, getTokenDetailsURL } from 'uniswap/src/utils/linking'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { useDebounce } from 'utilities/src/time/timing'

interface SearchModalProps {
  isModalOpen: boolean
  onClose: () => void
}

export const SearchModal = memo(function _SearchModal({ isModalOpen, onClose }: SearchModalProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const media = useMedia()
  const scrollbarStyles = useScrollbarStyles()

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
        <Flex
          $sm={{ px: '$spacing16', py: '$spacing4', borderColor: undefined, borderBottomWidth: 0 }}
          px="$spacing4"
          py="$spacing12"
          borderBottomColor="$surface3"
          borderBottomWidth={1}
        >
          <SearchTextInput
            autoFocus={!media.sm}
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
            placeholder={t('search.input.placeholder')}
            px="$spacing16"
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
              onSelect={onSelectOption}
            />
          ) : (
            <SearchModalNoQueryList chainFilter={chainFilter} onSelect={onSelectOption} />
          )}
        </Flex>
      </Flex>
    </Modal>
  )
})
