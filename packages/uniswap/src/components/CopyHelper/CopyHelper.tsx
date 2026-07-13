import { SharedEventName } from '@uniswap/analytics-events'
import { PropsWithChildren, ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  AnimatableCopyIcon,
  ColorTokens,
  Flex,
  isTouchable,
  Popover,
  Text,
  TextProps,
  TouchableArea,
  useShadowPropsMedium,
  useSporeColors,
} from 'ui/src'
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
}: CopyHelperProps): JSX.Element {
  const { t } = useTranslation()
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
  const offset = !isIconOnly && showIcon ? gap + iconSize : 0

  return (
    <TouchableArea
      disabled={disabled}
      testID={testID}
      flexDirection="row"
      gap={gap}
      alignItems="center"
      position="relative"
      $platform-web={{
        color: color ?? 'inherit',
      }}
      onPress={disabled ? undefined : copy}
      onMouseEnter={onHover}
      onMouseLeave={offHover}
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
      {!isIconOnly && (
        <Flex
          $platform-web={{
            maxWidth: `calc(100% - ${offset}px)`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
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
        <AnimatableCopyIcon
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
