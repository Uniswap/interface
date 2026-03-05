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
import { useEvent } from 'utilities/src/react/hooks'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useOnClickOutside } from '~/hooks/useOnClickOutside'

// Gap between the trigger element and the dropdown content
const DROPDOWN_OFFSET = 10

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
        bottom: `calc(100% + ${DROPDOWN_OFFSET}px)`,
        enterStyle: { opacity: 0, y: 20 },
        exitStyle: { opacity: 0, y: 20 },
      },
      false: {
        bottom: 'unset',
        top: `calc(100% + ${DROPDOWN_OFFSET}px)`,
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
  ignoredNodes?: React.RefObject<HTMLElement | undefined | null>[] // nodes to ignore for click-outside handling
  ignoreDialogClicks?: boolean // ignore clicks on dialog/modal elements
}

type AdaptiveDropdownProps = SharedDropdownProps & {
  trigger?: JSX.Element // optional when dropdown is controlled externally
  adaptWhen?: 'sm' | 'md'
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
  ignoredNodes,
  ignoreDialogClicks,
  adaptWhen = 'sm',
}: AdaptiveDropdownProps) {
  const node = useRef<HTMLDivElement | null>(null)
  const dropdownNode = useRef<HTMLDivElement | null>(null)
  const scrollbarStyles = useScrollbarStyles()
  const shadowProps = useShadowPropsMedium()
  const media = useMedia()
  const isSheet = !!adaptToSheet && media[adaptWhen]
  const handleClickOutside = useEvent(() => {
    if (isOpen) {
      toggleOpen(false)
    }
  })
  useOnClickOutside({ node, handler: isSheet ? undefined : handleClickOutside, ignoredNodes, ignoreDialogClicks })
  const [flipVertical, setFlipVertical] = useState(false)
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number | undefined>(undefined)

  // biome-ignore lint/correctness/useExhaustiveDependencies: +dropdownNode, +node
  useEffect(() => {
    if (isOpen && !isSheet && node.current) {
      const rect = node.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom - DROPDOWN_OFFSET
      const spaceAbove = rect.top - DROPDOWN_OFFSET

      if (allowFlip && dropdownNode.current) {
        const dropdownHeight = dropdownNode.current.offsetHeight
        const shouldFlip = forceFlipUp || (dropdownHeight > spaceBelow && spaceAbove > spaceBelow)
        setFlipVertical(shouldFlip)
        setDropdownMaxHeight(shouldFlip ? spaceAbove : spaceBelow)
      } else {
        setDropdownMaxHeight(spaceBelow)
      }
    }
  }, [isOpen, allowFlip, dropdownNode, node, positionFixed, isSheet, forceFlipUp])

  return (
    <>
      {!isSheet && (
        <VisuallyHidden>
          {/* This hidden copy is only for measuring dropdown height - data-testid-ignore lets tests filter it out */}
          <Flex ref={dropdownNode} data-testid-ignore>
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
          {trigger && (
            <MouseoverTooltip
              disabled={!tooltipText || isOpen}
              text={tooltipText}
              size={TooltipSize.Max}
              placement="top"
              style={{ width: '100%' }}
            >
              {trigger}
            </MouseoverTooltip>
          )}
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
                position={trigger ? 'absolute' : 'relative'}
                {...(!dropdownStyle?.maxHeight && dropdownMaxHeight !== undefined
                  ? { maxHeight: dropdownMaxHeight }
                  : {})}
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
          testID={dropdownTestId}
        >
          {children}
        </WebBottomSheet>
      )}
    </>
  )
}
