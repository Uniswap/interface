import { SharedEventName } from '@uniswap/analytics-events'
import { isTouchable } from '@universe/environment'
import { Flex, Text, type TextProps, TouchableArea } from '@universe/mycelium'
import type { ColorTokens } from '@universe/mycelium'
import { AnimatableCopyIconCompat } from '@universe/mycelium/animatable-copy-icon-compat'
import { type SporeColor, useShadowPropsMedium, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { PropsWithChildren, ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Popover } from 'ui/src'
import type { PopoverContentProps } from 'ui/src/components/popover/types'
import { zIndexes } from 'ui/src/theme'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'

export function CopyToClipboard({ toCopy, children }: PropsWithChildren<{ toCopy: string }>): JSX.Element {
  const { t } = useTranslation()
  const shadowProps = useShadowPropsMedium()
  const colors = useSporeColors()
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(toCopy).catch(() => {})
  }, [toCopy, setCopied])

  return (
    <Popover open={isCopied} placement="bottom" offset={8}>
      <Popover.Anchor>
        <TouchableArea onPress={copy}>
          <Flex row centered position="relative">
            {children}
          </Flex>
        </TouchableArea>
      </Popover.Anchor>
      <Popover.Content
        elevate
        zIndex={zIndexes.popover}
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        borderColor="$surface3"
        backgroundColor="$surface1"
        p="$spacing8"
        animation="fast"
        enterStyle={{ scale: 0.95, opacity: 0 }}
        exitStyle={{ scale: 0.95, opacity: 0 }}
        animateOnly={['transform', 'opacity']}
        // `useShadowPropsMedium`'s `$platform-web` types as the full mycelium compat style
        // surface (a superset of plain CSSProperties, the type Popover's own `$platform-web`
        // expects); the hook only ever sets `boxShadow`, a value both sides accept identically.
        {...(shadowProps as Pick<
          PopoverContentProps,
          'shadowColor' | 'shadowOffset' | 'shadowRadius' | '$platform-web'
        >)}
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
  testID?: string
  disabled?: boolean
  children?: ReactNode
  externalHover?: boolean
  onCopy?: () => void
  copyNotificationType?: CopyNotificationType
  analyticsElement?: ElementName
  /** Accessible name. Only used in the icon-only case, where there is no visible text to name the button. */
  ariaLabel?: string
}

export function CopyHelper({
  toCopy,
  color,
  textProps,
  iconSize = 20,
  gap = 4,
  iconPosition = 'left',
  iconColor = '$neutral2',
  alwaysShowIcon = false,
  dataTestId,
  testID,
  disabled = false,
  children,
  externalHover = false,
  onCopy,
  copyNotificationType,
  analyticsElement,
  ariaLabel,
}: CopyHelperProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  // The spore map is keyed by the $-prefixed token itself; the partial widening turns an
  // unknown token into undefined (-> CSS inheritance) instead of a throw.
  const sporeColors = colors as Partial<Record<string, SporeColor>>
  const dispatch = useDispatch()
  const [isCopied, setCopied] = useCopyClipboard(1000)

  const copy = useCallback(
    (e?: { preventDefault: () => void }) => {
      e?.preventDefault()
      setCopied(toCopy)
        .then(() => {
          if (copyNotificationType !== undefined) {
            dispatch(pushNotification({ type: AppNotificationType.Copied, copyType: copyNotificationType }))
          }
          if (analyticsElement !== undefined) {
            sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { element: analyticsElement })
          }
          onCopy?.()
        })
        .catch(() => {})
    },
    [analyticsElement, copyNotificationType, dispatch, onCopy, setCopied, toCopy],
  )

  const [isHover, setIsHover] = useState(false)
  const onHover = useCallback(() => setIsHover(true), [])
  const offHover = useCallback(() => setIsHover(false), [])

  const isIconOnly = children == null
  // Icon-only: always show icon. With children: right-icon shows on hover; left-icon always shows.
  const showIcon =
    isIconOnly ||
    alwaysShowIcon ||
    Boolean(iconPosition === 'left' || isHover || externalHover || isTouchable || isCopied)
  // With children the visible text already names the button; icon-only would otherwise announce unlabeled.
  const accessibleName = isIconOnly ? (ariaLabel ?? t('common.button.copy')) : undefined

  return (
    <TouchableArea
      disabled={disabled}
      testID={testID}
      aria-label={accessibleName}
      accessibilityLabel={accessibleName}
      flexDirection="row"
      gap={gap}
      alignItems="center"
      position="relative"
      style={{
        color: color !== undefined ? (sporeColors[color]?.val ?? 'inherit') : 'inherit',
      }}
      onPress={disabled ? undefined : copy}
      onMouseEnter={onHover}
      onMouseLeave={offHover}
    >
      {iconPosition === 'left' && showIcon && (
        <AnimatableCopyIconCompat
          hideIcon={!showIcon}
          isCopied={isCopied}
          size={iconSize}
          textColor={iconColor}
          dataTestId={dataTestId}
        />
      )}
      {/* Shrinks rather than `maxWidth: calc(100% - icon)`: in a shrink-to-fit parent that calc
          equals the text's own width, and sub-pixel rounding at fractional browser zoom wrapped it. */}
      {!isIconOnly && (
        <Flex className="overflow-hidden text-ellipsis whitespace-nowrap" minWidth={0} flexShrink={1}>
          {isCopied && iconPosition === 'left' ? (
            <Text variant="body3" color="$neutral3" {...textProps}>
              {t('common.copied')}
            </Text>
          ) : (
            children
          )}
        </Flex>
      )}
      {iconPosition === 'right' && !disabled && (
        <AnimatableCopyIconCompat
          hideIcon={!showIcon}
          isCopied={isCopied}
          size={iconSize}
          textColor={iconColor}
          dataTestId={dataTestId}
        />
      )}
    </TouchableArea>
  )
}
