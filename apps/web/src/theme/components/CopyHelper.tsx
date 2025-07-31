import { ReactComponent as TooltipTriangle } from 'assets/svg/tooltip_triangle.svg'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { PropsWithChildren, ReactNode, forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { CheckCircle, Copy, Icon } from 'react-feather'
import { Trans } from 'react-i18next'
import { ClickableTamaguiStyle, EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, isTouchable } from 'ui/src'

const TOOLTIP_WIDTH = 60

function Tooltip({ isCopyContractTooltip, tooltipX }: { isCopyContractTooltip: boolean; tooltipX?: number }) {
  return (
    <Flex
      alignItems="center"
      position="absolute"
      left={isCopyContractTooltip && tooltipX ? `${tooltipX - TOOLTIP_WIDTH / 2}px` : '50%'}
      transform="translate(5px, 32px)"
      zIndex="$tooltip"
    >
      <TooltipTriangle path="black" />
      <Text
        color="$white"
        variant="body3"
        borderRadius="$rounded8"
        backgroundColor="$black"
        textAlign="center"
        justifyContent="center"
        width={!isCopyContractTooltip ? `${TOOLTIP_WIDTH}px` : 'auto'}
        height={!isCopyContractTooltip ? '32px' : 'auto'}
        lineHeight={!isCopyContractTooltip ? '32px' : 'auto'}
      >
        <Trans i18nKey="common.copied" />
      </Text>
    </Flex>
  )
}

export function CopyToClipboard({ toCopy, children }: PropsWithChildren<{ toCopy: string }>) {
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(toCopy)
  }, [toCopy, setCopied])
  return (
    <Flex
      row
      onPress={copy}
      justifyContent="center"
      alignItems="center"
      {...ClickableTamaguiStyle}
      $platform-web={{
        textDecoration: 'none',
      }}
    >
      {children}
      {isCopied && <Tooltip isCopyContractTooltip={false} />}
    </Flex>
  )
}

function isEllipsisActive(element: HTMLDivElement | null) {
  return Boolean(element && element.offsetWidth < element.scrollWidth)
}

interface CopyHelperProps {
  InitialIcon?: Icon | null
  CopiedIcon?: Icon
  toCopy: string
  color?: string
  fontSize?: number
  iconSize?: number
  gap?: number
  iconPosition?: 'left' | 'right'
  iconColor?: string
  alwaysShowIcon?: boolean
  children: ReactNode
}

type CopyHelperRefType = { forceCopy: () => void }

export const CopyHelper = forwardRef<CopyHelperRefType, CopyHelperProps>(
  (
    {
      InitialIcon = Copy,
      CopiedIcon = (props) => <CheckCircle {...props} color="var(--statusSuccess)" strokeWidth={1.5} />,
      toCopy,
      color,
      fontSize,
      iconSize = 20,
      gap = 4,
      iconPosition = 'left',
      iconColor = 'currentColor',
      alwaysShowIcon = false,
      children,
    }: CopyHelperProps,
    ref,
  ) => {
    const [isCopied, setCopied] = useCopyClipboard()
    const copy = useCallback(() => {
      setCopied(toCopy)
    }, [toCopy, setCopied])

    useImperativeHandle(ref, () => ({
      forceCopy() {
        copy()
      },
    }))

    // Detects is text is ellipsing in order to shorten gap caused by extra space browsers add after ... chars
    const textRef = useRef<HTMLDivElement>(null)
    const isEllipsis = isEllipsisActive(textRef.current)
    const displayGap = isEllipsis ? gap - 4 : gap

    const [isHover, setIsHover] = useState(false)
    const onHover = useCallback(() => setIsHover(true), [])
    const offHover = useCallback(() => setIsHover(false), [])

    // Copy-helpers w/ left icon always show icon & display "Copied!" in copied state
    // Copy-helpers w/ right icon show icon on hover & do not change text
    const showIcon = alwaysShowIcon || Boolean(iconPosition === 'left' || isHover || isTouchable || isCopied)
    const Icon = isCopied ? CopiedIcon : showIcon ? InitialIcon : null
    const offset = showIcon ? gap + iconSize : 0
    return (
      <Flex
        row
        onPress={copy}
        gap={displayGap}
        onMouseEnter={onHover}
        onMouseLeave={offHover}
        {...ClickableTamaguiStyle}
        alignItems="center"
        $platform-web={{
          color: color ?? 'inherit',
        }}
      >
        {iconPosition === 'left' && Icon && <Icon size={iconSize} strokeWidth={1.5} color={iconColor} />}
        <Flex
          ref={textRef}
          maxWidth={`calc(100% - ${offset + 'px'})`}
          {...EllipsisTamaguiStyle}
          $platform-web={{
            fontSize: fontSize ? fontSize : 'inherit',
          }}
        >
          {isCopied && iconPosition === 'left' ? (
            <Text>
              <Trans i18nKey="common.copied" />
            </Text>
          ) : (
            children
          )}
        </Flex>
        <Flex $platform-web={{ clear: 'both' }} />
        {iconPosition === 'right' && Icon && <Icon size={iconSize} strokeWidth={1.5} color={iconColor} />}
      </Flex>
    )
  },
)
CopyHelper.displayName = 'CopyHelper'
