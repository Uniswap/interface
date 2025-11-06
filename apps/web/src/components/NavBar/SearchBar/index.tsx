import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { NavIcon } from 'components/NavBar/NavIcon'
import { SearchModal } from 'components/NavBar/SearchBar/SearchModal'
import { useIsSearchBarVisible } from 'components/NavBar/SearchBar/useIsSearchBarVisible'
import { useModalState } from 'hooks/useModalState'
import styled, { useTheme } from 'lib/styled-components'
import { Search } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ElementName, InterfaceEventName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { KeyAction } from 'utilities/src/device/keyboard/types'
import { useKeyDown } from 'utilities/src/device/keyboard/useKeyDown'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const NAV_SEARCH_MIN_WIDTH = '340px'

const KeyShortcut = styled.div`
  background-color: ${({ theme }) => theme.surface3};
  color: ${({ theme }) => theme.neutral2};
  padding: 0px 8px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 535;
  line-height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  backdrop-filter: blur(60px);
`

const SearchIcon = styled.div`
  width: 20px;
  height: 20px;
`

export const SearchBar = () => {
  const poolSearchEnabled = useFeatureFlag(FeatureFlags.PoolSearch)
  const isNavSearchInputVisible = useIsSearchBarVisible()

  const theme = useTheme()
  const { t } = useTranslation() // subscribe to locale changes

  const {
    isOpen: isModalOpen,
    closeModal: closeSearchModal,
    openModal: openSearchModal,
  } = useModalState(ModalName.Search)

  useKeyDown({
    callback: openSearchModal,
    keys: ['/'],
    disabled: isModalOpen,
    preventDefault: !isModalOpen,
    keyAction: KeyAction.UP,
    shouldTriggerInInput: false,
  })
  useKeyDown({
    callback: closeSearchModal,
    keys: ['Escape'],
    keyAction: KeyAction.UP,
    disabled: !isModalOpen,
    preventDefault: true,
    shouldTriggerInInput: true,
  })

  const trace = useTrace({ section: SectionName.NavbarSearch })

  const placeholderText = poolSearchEnabled ? t('search.input.placeholder') : t('tokens.selector.search.placeholder')

  return (
    <Trace section={SectionName.NavbarSearch}>
      <SearchModal />
      {isNavSearchInputVisible ? (
        <TouchableArea onPress={openSearchModal} data-testid="nav-search-input" width={NAV_SEARCH_MIN_WIDTH}>
          <Flex
            row
            backgroundColor="$surface2"
            borderWidth={1}
            borderColor="$surface3"
            py="$spacing8"
            px="$spacing16"
            borderRadius="$rounded20"
            height={40}
            alignItems="center"
            justifyContent="space-between"
            hoverStyle={{
              backgroundColor: '$surface1Hovered',
            }}
          >
            <Flex row gap="$spacing12">
              <SearchIcon data-cy="nav-search-icon">
                <Search width="20px" height="20px" color={theme.neutral2} />
              </SearchIcon>
              <Trace
                logFocus
                eventOnTrigger={InterfaceEventName.NavbarSearchSelected}
                element={ElementName.NavbarSearchInput}
                properties={{ ...trace }}
              >
                <Text fontWeight="$book" color="$neutral2" textAlign="left">
                  {placeholderText}
                </Text>
              </Trace>
            </Flex>
            <KeyShortcut>/</KeyShortcut>
          </Flex>
        </TouchableArea>
      ) : (
        <NavIcon onClick={openSearchModal} label={placeholderText}>
          <SearchIcon data-cy="nav-search-icon">
            <Search width="20px" height="20px" color={theme.neutral2} />
          </SearchIcon>
        </NavIcon>
      )}
    </Trace>
  )
}
