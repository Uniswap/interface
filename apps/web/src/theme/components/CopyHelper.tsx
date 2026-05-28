import { forwardRef, PropsWithChildren, ReactNode, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AnimatableCopyIcon,
  ColorTokens,
  Flex,
  isTouchable,
  Popover,
  Text,
  TextProps,
  useShadowPropsMedium,
  useSporeColors,
} from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { useCopyClipboard } from '~/hooks/useCopyClipboard'
import { ClickableTamaguiStyle, EllipsisTamaguiStyle } from '~/theme/components/styles'

export function CopyToClipboard({ toCopy, children }: PropsWithChildren<{ toCopy: string }>) {
  const { t } = useTranslation()
  const shadowProps = useShadowPropsMedium()
  const colors = useSporeColors()
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(toCopy)
  }, [toCopy, setCopied])

  return (
    <Popover open={isCopied} placement="bottom" offset={8}>
      <Popover.Anchor>
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
        </Flex>
      </Popover.Anchor>
      <Popover.Content
        zIndex={zIndexes.popover}
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        borderColor="$surface3"
        backgroundColor="$surface1"
        p="$spacing8"
        elevate
        animation="fast"
        enterStyle={{ scale: 0.95, opacity: 0 }}
        exitStyle={{ scale: 0.95, opacity: 0 }}
        animateOnly={['transform', 'opacity']}
        {...shadowProps}
      >
        <Popover.Arrow
          size="$spacing12"
          backgroundColor={colors.surface1.val}
          borderWidth="$spacing1"
          borderColor={colors.surface3.val}
        />
        <Text variant="body3">{t('common.copied')}</Text>
      </Popover.Content>
    </Popover>
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
  onCopy?: () => void
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
      onCopy,
    }: CopyHelperProps,
    ref,
  ) => {
    const { t } = useTranslation()
    const [isCopied, setCopied] = useCopyClipboard(1000)

    const copy = useCallback(
      (e?: { preventDefault: () => void }) => {
        e?.preventDefault()
        setCopied(toCopy)
        onCopy?.()
      },
      [onCopy, toCopy, setCopied],
    )

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
              {t('common.copied')}
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
