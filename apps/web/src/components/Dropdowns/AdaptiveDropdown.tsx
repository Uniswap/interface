import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  Flex,
  FlexProps,
  styled,
  Text,
  useMedia,
  useScrollbarStyles,
  useShadowPropsMedium,
  VisuallyHidden,
  WebBottomSheet,
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
  zIndex: zIndexes.dropdown,
  animation: 'fastHeavy',
  '$platform-web': { overflow: 'auto' },
  variants: {
    positionRight: {
      true: {
        right: 0,
        left: 'unset',
      },
      false: {
        right: 'unset',
        left: 0,
      },
    },
    positionTop: {
      true: {
        top: 'unset',
        bottom: 'calc(100% + 10px)',
        enterStyle: { opacity: 0, y: 20 },
        exitStyle: { opacity: 0, y: 20 },
      },
      false: {
        bottom: 'unset',
        top: 'calc(100% + 10px)',
        enterStyle: { opacity: 0, y: -20 },
        exitStyle: { opacity: 0, y: -20 },
      },
    },
  },
})

const DropdownContainer = styled(Text, {
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  borderWidth: '$none',
  textAlign: 'left',
  width: '100%',
})

export interface SharedDropdownProps {
  isOpen: boolean
  toggleOpen: (open: boolean) => void
  dropdownTestId?: string
  adaptToSheet?: boolean
  tooltipText?: string
  dropdownStyle?: FlexProps
  containerStyle?: React.CSSProperties
  alignRight?: boolean
  allowFlip?: boolean
  positionFixed?: boolean // used to determine if fixed dropdown should be flipped
  forceFlipUp?: boolean // force dropdown to render above trigger
  children: JSX.Element | JSX.Element[]
}

type AdaptiveDropdownProps = SharedDropdownProps & {
  trigger: JSX.Element
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
  allowFlip,
  positionFixed,
  forceFlipUp,
  children,
}: AdaptiveDropdownProps) {
  const node = useRef<HTMLDivElement | null>(null)
  const dropdownNode = useRef<HTMLDivElement | null>(null)
  useOnClickOutside({ node, handler: () => isOpen && toggleOpen(false) })
  const scrollbarStyles = useScrollbarStyles()
  const shadowProps = useShadowPropsMedium()
  const media = useMedia()
  const isSheet = !!adaptToSheet && media.sm
  const [flipVertical, setFlipVertical] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: +dropdownNode, +node
  useEffect(() => {
    if (isOpen && allowFlip && !isSheet) {
      if (dropdownNode.current && node.current) {
        const rect = node.current.getBoundingClientRect()
        const verticalPageOffset = rect.height + rect.top + 15
        const dropdownContainerHeight = positionFixed ? window.innerHeight : document.body.offsetHeight
        const shouldFlip = dropdownNode.current.offsetHeight + verticalPageOffset > dropdownContainerHeight
        setFlipVertical(forceFlipUp || shouldFlip)
      }
    }
  }, [isOpen, allowFlip, dropdownNode, node, positionFixed, isSheet, forceFlipUp])

  return (
    <>
      {!isSheet && (
        <VisuallyHidden>
          <Flex ref={dropdownNode}>
            {/* hidden node cannot be position absolute or else height will register as 0 */}
            <DropdownContent
              animation="fastHeavy"
              {...dropdownStyle}
              {...shadowProps}
              style={scrollbarStyles}
              positionRight={alignRight}
              positionTop={false}
            >
              {children}
            </DropdownContent>
          </Flex>
        </VisuallyHidden>
      )}
      {/* biome-ignore lint/correctness/noRestrictedElements: needed here */}
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
                positionRight={alignRight}
                positionTop={flipVertical}
                position="absolute"
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
