import Column from 'components/Column'
import FilterButton from 'components/DropdownSelector/FilterButton'
import { MOBILE_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { css } from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'

export const InternalMenuItem = styled.div<{ disabled?: boolean }>`
  display: flex;
  flex: 1;
  padding: 12px 8px;
  color: ${({ theme }) => theme.neutral1};
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  cursor: pointer;
  border-radius: 8px;

  :hover {
    background-color: ${({ theme }) => theme.surface3};
  }

  ${({ disabled }) =>
    disabled &&
    css`
      opacity: 60%;
      pointer-events: none;
    `}
`
const MenuFlyout = styled(Column)<{ isInfoExplorePageEnabled: boolean; menuFlyoutCss?: string }>`
  min-width: 150px;
  overflow: auto;
  background-color: ${({ theme }) => theme.surface1};
  box-shadow: ${({ theme }) => theme.deprecated_deepShadow};
  border: 0.5px solid ${({ theme }) => theme.surface3};
  border-radius: 12px;
  padding: 8px;
  font-size: 16px;
  position: absolute;
  top: 48px;
  z-index: ${Z_INDEX.dropdown};

  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => `${theme.surface3} transparent`};

  // safari and chrome scrollbar styling
  ::-webkit-scrollbar {
    background: transparent;
    width: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.surface3};
    border-radius: 8px;
  }

  ${({ menuFlyoutCss }) => menuFlyoutCss}
`
const StyledMenu = styled.div<{ isInfoExplorePageEnabled: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
  ${({ isInfoExplorePageEnabled }) =>
    !isInfoExplorePageEnabled &&
    css`
      @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
        width: 72px;
      }
    `}
`
const StyledMenuContent = styled.div<{ isInfoExplorePageEnabled: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  border: none;
  font-weight: 535;
  width: 100%;
  vertical-align: middle;
  ${({ isInfoExplorePageEnabled }) => isInfoExplorePageEnabled && 'white-space: nowrap;'}
`
const Chevron = styled.span<{ open: boolean }>`
  padding-top: 1px;
  color: ${({ open, theme }) => (open ? theme.neutral1 : theme.neutral2)};
`
const StyledFilterButton = styled(FilterButton)<{ isInfoExplorePageEnabled: boolean; buttonCss?: string }>`
  ${({ buttonCss }) => buttonCss}
`

interface DropdownSelectorProps {
  modal: ApplicationModal
  menuLabel: JSX.Element
  internalMenuItems: JSX.Element
  dataTestId?: string
  buttonCss?: any
  menuFlyoutCss?: any
}

export function DropdownSelector({
  modal,
  menuLabel,
  internalMenuItems,
  dataTestId,
  buttonCss,
  menuFlyoutCss,
}: DropdownSelectorProps) {
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(modal)
  const toggleMenu = useToggleModal(modal)
  useOnClickOutside(node, open ? toggleMenu : undefined)

  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

  return (
    <StyledMenu isInfoExplorePageEnabled={isInfoExplorePageEnabled} ref={node}>
      <StyledFilterButton
        isInfoExplorePageEnabled={isInfoExplorePageEnabled}
        onClick={toggleMenu}
        active={open}
        aria-label={dataTestId}
        data-testid={dataTestId}
        buttonCss={buttonCss}
      >
        <StyledMenuContent isInfoExplorePageEnabled={isInfoExplorePageEnabled}>
          {menuLabel}
          <Chevron open={open}>
            {open ? (
              <ChevronUp width={20} height={15} viewBox="0 0 24 20" />
            ) : (
              <ChevronDown width={20} height={15} viewBox="0 0 24 20" />
            )}
          </Chevron>
        </StyledMenuContent>
      </StyledFilterButton>
      {open && (
        <MenuFlyout isInfoExplorePageEnabled={isInfoExplorePageEnabled} menuFlyoutCss={menuFlyoutCss}>
          {internalMenuItems}
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
