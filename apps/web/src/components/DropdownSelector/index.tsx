import FilterButton from 'components/DropdownSelector/FilterButton'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef } from 'react'
import {
  AnimatePresence,
  Flex,
  FlexProps,
  Text,
  WebBottomSheet,
  styled,
  useMedia,
  useScrollbarStyles,
  useShadowPropsMedium,
} from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import { iconSizes } from 'ui/src/theme/iconSizes'

export const InternalMenuItem = styled(Text, {
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '$spacing8',
  py: '$spacing12',
  gap: '$gap12',
  color: '$neutral1',
  textDecorationLine: 'none',
  cursor: 'pointer',
  borderRadius: '$rounded8',
  hoverStyle: {
    backgroundColor: '$surface3',
  },
  variants: {
    disabled: {
      true: {
        opacity: 0.6,
        cursor: 'default',
      },
    },
  } as const,
})

const MenuFlyout = styled(Text, {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 150,
  backgroundColor: '$surface1',
  borderWidth: 0.5,
  borderStyle: 'solid',
  borderColor: '$surface3',
  borderRadius: '$rounded12',
  p: '$spacing8',
  fontSize: 16,
  position: 'absolute',
  top: 'calc(100% + 12px)',
  zIndex: zIndexes.dropdown,
  animation: 'fastHeavy',
  enterStyle: { opacity: 0, y: -20 },
  exitStyle: { opacity: 0, y: -20 },
})

const StyledMenu = styled(Text, {
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  borderWidth: '$none',
  textAlign: 'left',
  width: '100%',
})

interface DropdownSelectorProps {
  isOpen: boolean
  toggleOpen: (open: boolean) => void
  menuLabel: JSX.Element
  internalMenuItems: JSX.Element
  dataTestId?: string
  optionsContainerTestId?: string
  tooltipText?: string
  hideChevron?: boolean
  buttonStyle?: FlexProps
  dropdownStyle?: FlexProps
  adaptToSheet?: boolean
  containerStyle?: React.CSSProperties
}

export function DropdownSelector({
  isOpen,
  toggleOpen,
  menuLabel,
  internalMenuItems,
  dataTestId,
  optionsContainerTestId,
  tooltipText,
  hideChevron,
  buttonStyle,
  dropdownStyle,
  adaptToSheet = true,
  containerStyle,
}: DropdownSelectorProps) {
  const node = useRef<HTMLDivElement | null>(null)
  useOnClickOutside(node, () => isOpen && toggleOpen(false))
  const scrollbarStyles = useScrollbarStyles()
  const shadowProps = useShadowPropsMedium()
  const media = useMedia()
  const isSheet = adaptToSheet && media.sm

  return (
    <>
      <div ref={node} style={{ width: '100%', ...containerStyle }}>
        <StyledMenu id="Dropdown">
          <MouseoverTooltip
            disabled={!tooltipText}
            text={tooltipText}
            size={TooltipSize.Max}
            placement="top"
            style={{ width: '100%' }}
          >
            <FilterButton
              onPress={() => toggleOpen(!isOpen)}
              active={isOpen}
              aria-label={dataTestId}
              data-testid={dataTestId}
              {...buttonStyle}
            >
              <Flex row justifyContent="space-between" alignItems="center" gap="$gap8" width="100%">
                {menuLabel}
                {!hideChevron && (
                  <RotatableChevron
                    animation="200ms"
                    color="$neutral2"
                    direction={isOpen ? 'up' : 'down'}
                    height={iconSizes.icon20}
                    width={iconSizes.icon20}
                  />
                )}
              </Flex>
            </FilterButton>
          </MouseoverTooltip>
          <AnimatePresence>
            {isOpen && !isSheet && (
              <MenuFlyout
                data-testid={optionsContainerTestId}
                {...dropdownStyle}
                {...shadowProps}
                $platform-web={{ overflow: 'auto' }}
                style={scrollbarStyles}
              >
                {internalMenuItems}
              </MenuFlyout>
            )}
          </AnimatePresence>
        </StyledMenu>
      </div>
      <WebBottomSheet
        isOpen={isOpen && isSheet}
        onClose={() => toggleOpen(false)}
        {...dropdownStyle}
        maxHeight={`calc(100dvh - ${INTERFACE_NAV_HEIGHT}px)`}
      >
        {internalMenuItems}
      </WebBottomSheet>
    </>
  )
}
