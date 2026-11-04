import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { Search } from '@universe/mycelium/icons/Search'
import { styled } from '@universe/mycelium/styled'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { ElementName, InterfaceEventName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { KeyAction } from 'utilities/src/device/keyboard/types'
import { useKeyDown } from 'utilities/src/device/keyboard/useKeyDown'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { NavIcon } from '~/components/NavBar/NavIcon'
import { SearchModal } from '~/components/NavBar/SearchBar/SearchModal'
import { NavSearchVariant } from '~/components/NavBar/SearchBar/useNavSearchVariant'
import { useModalState } from '~/hooks/useModalState'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

export const NAV_CONTROL_HEIGHT = 36

type SearchInputStyle = { width: string; height: number; showShortcut: boolean }

// No `/` hint on the compact input: it only shows on touch-sized layouts.
const SEARCH_INPUT_STYLES: Record<NavSearchVariant, SearchInputStyle | undefined> = {
  [NavSearchVariant.Icon]: undefined,
  [NavSearchVariant.LegacyInput]: { width: '320px', height: 40, showShortcut: true },
  [NavSearchVariant.Input]: { width: '240px', height: NAV_CONTROL_HEIGHT, showShortcut: true },
  [NavSearchVariant.CompactInput]: { width: '184px', height: NAV_CONTROL_HEIGHT, showShortcut: false },
}

const KeyShortcut = styled('div', {
  platform: 'web',
  base: 'bg-surface3 text-neutral2 [padding:0px_8px] w-[20px] h-[20px] rounded-[4px] text-[12px] font-[535] [line-height:16px] flex items-center justify-center opacity-60 backdrop-blur-[60px]',
})

const SearchIcon = styled('div', {
  platform: 'web',
  base: 'w-[20px] h-[20px]',
})

// The shared Search glyph bakes in fillOpacity 0.63; on mobile the nav icon matches the hamburger's full opacity.
const NavSearchIcon = styled('div', {
  platform: 'web',
  base: 'w-[20px] h-[20px] media-md:[&_path]:[fill-opacity:1]',
})

export const SearchBar = ({ variant }: { variant: NavSearchVariant }) => {
  const { t } = useTranslation()
  const inputStyle = SEARCH_INPUT_STYLES[variant]
  const isAuctionSearchEnabled = useFeatureFlag(FeatureFlags.AuctionSearch)

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

  const placeholderText = t('search.input.placeholder.header')

  return (
    <Trace section={SectionName.NavbarSearch}>
      <SearchModal isAuctionSearchEnabled={isAuctionSearchEnabled} />
      {inputStyle ? (
        <TouchableArea onPress={openSearchModal} testID="nav-search-input" width={inputStyle.width}>
          <Flex
            row
            backgroundColor="$surface2"
            borderWidth="$spacing1"
            borderColor="$surface3"
            py="$spacing8"
            px="$spacing16"
            borderRadius="$rounded20"
            height={inputStyle.height}
            alignItems="center"
            justifyContent="space-between"
            hoverStyle={{
              backgroundColor: '$surface1Hovered',
            }}
          >
            <Flex shrink row alignItems="center" gap="$spacing12">
              <SearchIcon data-testid={TestID.NavSearchIcon}>
                <Search size="$icon.20" color="$neutral2" />
              </SearchIcon>
              <Trace
                logFocus
                eventOnTrigger={InterfaceEventName.NavbarSearchSelected}
                element={ElementName.NavbarSearchInput}
                properties={{ ...trace }}
              >
                <Text fontWeight="$book" color="$neutral2" textAlign="left" {...EllipsisTamaguiStyle}>
                  {placeholderText}
                </Text>
              </Trace>
            </Flex>
            {inputStyle.showShortcut && <KeyShortcut>/</KeyShortcut>}
          </Flex>
        </TouchableArea>
      ) : (
        <NavIcon onClick={openSearchModal} label={placeholderText}>
          <NavSearchIcon data-testid={TestID.NavSearchIcon}>
            <Search size="$icon.20" color="$neutral2" />
          </NavSearchIcon>
        </NavIcon>
      )}
    </Trace>
  )
}
