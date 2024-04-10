import Column from 'components/Column'
import FilterButton from 'components/DropdownSelector/FilterButton'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import React, { useRef } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import styled, { css } from 'styled-components'
import { dropdownSlideDown } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'

export const InternalMenuItem = styled.div<{ disabled?: boolean }>`
  display: flex;
  flex: 1;
  padding: 12px 8px;
  gap: 12px;
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
const MenuFlyout = styled(Column)<{ menuFlyoutCss?: string }>`
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
  ${dropdownSlideDown}

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

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.xs}px) {
    position: fixed;
    top: unset;
    bottom: 0;
    left: 0;
    width: 100vw;
    padding: 12px 16px;
    background: ${({ theme }) => theme.surface2};
    border: ${({ theme }) => `1px solid ${theme.surface3}`};
    border-radius: 12px 12px 0 0;
    z-index: ${Z_INDEX.modal};
    animation: none;
  }
`
const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
  width: 100%;
`
const StyledMenuContent = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  border: none;
  font-weight: 535;
  width: 100%;
  vertical-align: middle;
  white-space: nowrap;
`
const Chevron = styled.span<{ open: boolean }>`
  padding-top: 1px;
  color: ${({ open, theme }) => (open ? theme.neutral1 : theme.neutral2)};
`
const StyledFilterButton = styled(FilterButton)<{ buttonCss?: string }>`
  ${({ buttonCss }) => buttonCss}
`

interface DropdownSelectorProps {
  isOpen: boolean
  toggleOpen: React.DispatchWithoutAction
  menuLabel: JSX.Element
  internalMenuItems: JSX.Element
  dataTestId?: string
  tooltipText?: string
  hideChevron?: boolean
  buttonCss?: any
  menuFlyoutCss?: any
}

export function DropdownSelector({
  isOpen,
  toggleOpen,
  menuLabel,
  internalMenuItems,
  dataTestId,
  tooltipText,
  hideChevron,
  buttonCss,
  menuFlyoutCss,
}: DropdownSelectorProps) {
  const node = useRef<HTMLDivElement | null>(null)
  useOnClickOutside(node, isOpen ? toggleOpen : undefined)

  return (
    <StyledMenu ref={node}>
      <MouseoverTooltip
        disabled={!tooltipText}
        text={tooltipText}
        size={TooltipSize.Max}
        placement="top"
        style={{ width: '100%' }}
      >
        <StyledFilterButton
          onClick={toggleOpen}
          active={isOpen}
          aria-label={dataTestId}
          data-testid={dataTestId}
          buttonCss={buttonCss}
        >
          <StyledMenuContent>
            {menuLabel}
            {!hideChevron && (
              <Chevron open={isOpen}>
                {isOpen ? (
                  <ChevronUp width={20} height={15} viewBox="0 0 24 20" />
                ) : (
                  <ChevronDown width={20} height={15} viewBox="0 0 24 20" />
                )}
              </Chevron>
            )}
          </StyledMenuContent>
        </StyledFilterButton>
      </MouseoverTooltip>
      {isOpen && <MenuFlyout menuFlyoutCss={menuFlyoutCss}>{internalMenuItems}</MenuFlyout>}
    </StyledMenu>
  )
}
