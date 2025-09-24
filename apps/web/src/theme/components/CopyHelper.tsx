import { ReactComponent as TooltipTriangle } from 'assets/svg/tooltip_triangle.svg'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { forwardRef, PropsWithChildren, ReactNode, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { ClickableTamaguiStyle, EllipsisTamaguiStyle } from 'theme/components/styles'
import { AnimatableCopyIcon, ColorTokens, Flex, isTouchable, Text, TextProps } from 'ui/src'

const TOOLTIP_WIDTH = 60

function Tooltip() {
  return (
    <Flex
      alignItems="center"
      position="absolute"
      top="100%"
      marginTop="$spacing8"
      zIndex="$tooltip"
      animation="quick"
      enterStyle={{ opacity: 0, y: -5 }}
      exitStyle={{ opacity: 0, y: -5 }}
    >
      <TooltipTriangle path="black" />
      <Text
        color="$white"
        variant="body3"
        borderRadius="$rounded8"
        backgroundColor="$black"
        textAlign="center"
        justifyContent="center"
        width={`${TOOLTIP_WIDTH}px`}
        height="32px"
        lineHeight="32px"
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
      position="relative"
      {...ClickableTamaguiStyle}
      $platform-web={{
        textDecoration: 'none',
      }}
    >
      {children}
      {isCopied && <Tooltip />}
    </Flex>
  )
}

function isEllipsisActive(element: HTMLDivElement | null) {
  return Boolean(element && element.offsetWidth < element.scrollWidth)
}

interface CopyHelperProps {
  toCopy: string
  color?: ColorTokens
  textProps?: TextProps
  iconSize?: number
  gap?: number
  iconPosition?: 'left' | 'right'
  iconColor?: ColorTokens
  alwaysShowIcon?: boolean
  dataTestId?: string
  disabled?: boolean
  children: ReactNode
  externalHover?: boolean
}

type CopyHelperRefType = { forceCopy: () => void }

export const CopyHelper = forwardRef<CopyHelperRefType, CopyHelperProps>(
  (
    {
      toCopy,
      color,
      textProps,
      iconSize = 20,
      gap = 4,
      iconPosition = 'left',
      iconColor = '$neutral2',
      alwaysShowIcon = false,
      dataTestId,
      disabled = false,
      children,
      externalHover = false,
    }: CopyHelperProps,
    ref,
  ) => {
    const [isCopied, setCopied] = useCopyClipboard(1000)

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
    const showIcon =
      alwaysShowIcon || Boolean(iconPosition === 'left' || isHover || externalHover || isTouchable || isCopied)
    const offset = showIcon ? gap + iconSize : 0
    return (
      <Flex
        row
        onPress={disabled ? undefined : copy}
        gap={displayGap}
        onMouseEnter={onHover}
        onMouseLeave={offHover}
        {...(!disabled && ClickableTamaguiStyle)}
        position="relative"
        alignItems="center"
        $platform-web={{
          color: color ?? 'inherit',
        }}
      >
        {iconPosition === 'left' && showIcon && (
          <AnimatableCopyIcon
            hideIcon={!showIcon}
            isCopied={isCopied}
            size={iconSize}
            textColor={iconColor}
            dataTestId={dataTestId}
          />
        )}
        <Flex ref={textRef} maxWidth={`calc(100% - ${offset + 'px'})`} {...EllipsisTamaguiStyle}>
          {isCopied && iconPosition === 'left' ? (
            <Text variant="body3" color="neutral3" {...textProps}>
              <Trans i18nKey="common.copied" />
            </Text>
          ) : (
            children
          )}
        </Flex>
        <Flex $platform-web={{ clear: 'both' }} />
        {iconPosition === 'right' && !disabled && (
          <AnimatableCopyIcon
            hideIcon={!showIcon}
            isCopied={isCopied}
            size={iconSize}
            textColor={iconColor}
            dataTestId={dataTestId}
          />
        )}
      </Flex>
    )
  },
)
CopyHelper.displayName = 'CopyHelper'
