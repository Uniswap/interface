import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef } from 'react'
import {
  AnimatePresence,
  FlexProps,
  Text,
  WebBottomSheet,
  styled,
  useMedia,
  useScrollbarStyles,
  useShadowPropsMedium,
} from 'ui/src'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'

const DropdownContent = styled(Text, {
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
  zIndex: zIndexes.dropdown,
  animation: 'fastHeavy',
  '$platform-web': { overflow: 'auto' },
  enterStyle: { opacity: 0, y: -20 },
  exitStyle: { opacity: 0, y: -20 },
})

const DropdownContainer = styled(Text, {
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  borderWidth: '$none',
  textAlign: 'left',
  width: '100%',
})

interface AdaptiveDropdownProps {
  isOpen: boolean
  toggleOpen: (open: boolean) => void
  trigger: JSX.Element
  dropdownTestId?: string
  adaptToSheet?: boolean
  tooltipText?: string
  dropdownStyle?: FlexProps
  containerStyle?: React.CSSProperties
  alignRight?: boolean
  children: JSX.Element | JSX.Element[]
}

export function AdaptiveDropdown({
  isOpen,
  toggleOpen,
  trigger,
  dropdownTestId,
  tooltipText,
  adaptToSheet,
  dropdownStyle,
  containerStyle,
  alignRight,
  children,
}: AdaptiveDropdownProps) {
  const node = useRef<HTMLDivElement | null>(null)
  useOnClickOutside(node, () => isOpen && toggleOpen(false))
  const scrollbarStyles = useScrollbarStyles()
  const shadowProps = useShadowPropsMedium()
  const media = useMedia()
  const isSheet = !!adaptToSheet && media.sm

  return (
    <>
      <div ref={node} style={{ width: '100%', ...containerStyle }}>
        <DropdownContainer>
          <MouseoverTooltip
            disabled={!tooltipText || isOpen}
            text={tooltipText}
            size={TooltipSize.Max}
            placement="top"
            style={{ width: '100%' }}
          >
            {trigger}
          </MouseoverTooltip>
          <AnimatePresence>
            {isOpen && !isSheet && (
              <DropdownContent
                data-testid={dropdownTestId}
                animation="fastHeavy"
                {...dropdownStyle}
                {...shadowProps}
                style={scrollbarStyles}
                right={alignRight ? 0 : 'unset'}
                left={!alignRight ? 0 : 'unset'}
                top="calc(100% + 20px)"
              >
                {children}
              </DropdownContent>
            )}
          </AnimatePresence>
        </DropdownContainer>
      </div>
      {isSheet && (
        <WebBottomSheet
          isOpen={isOpen}
          onClose={() => toggleOpen(false)}
          maxHeight={`calc(100dvh - ${INTERFACE_NAV_HEIGHT}px)`}
        >
          {children}
        </WebBottomSheet>
      )}
    </>
  )
}
