import { Button, type ButtonPressHandler, type ButtonProps, Flex, Text, Tooltip, useMedia } from '@universe/mycelium'
import { AMOUNT_INPUT_PRESETS_STYLES } from '@universe/transactions-ui/src/common/AmountInputPresets/amountInputPresetsStyles'
import type { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'

/** 100 and `max` both read "Max"; they stay distinct for the host's analytics. */
export type AmountPresetPercentage = 25 | 50 | 75 | 100 | 'max'

export interface AmountPreset {
  percentage: AmountPresetPercentage
  /** Nothing to fill: the balance is empty, or Max is already set. */
  disabled?: boolean
  /** Web only: shown on hover while disabled, e.g. why Max keeps some of the native balance for gas. */
  disabledTooltip?: string
  testID?: string
}

/**
 * `outlined`: the small chips in the amount panel. `branded`: a lone Max next to a balance.
 * `large`: the full-width row above the native decimal pad.
 */
export type AmountInputPresetsAppearance = 'outlined' | 'branded' | 'large'

export interface AmountInputPresetsProps {
  presets: AmountPreset[]
  /** The host computes the amount for the percentage, as PresetAmountButton did. */
  onSelectPreset: (percentage: AmountPresetPercentage) => void
  /** A press on a disabled preset. Native hosts open the max balance info modal from it. */
  onPressDisabledPreset?: (percentage: AmountPresetPercentage) => void
  appearance?: AmountInputPresetsAppearance
  /**
   * Hidden until the enclosing `group` is hovered, then staggered in. The host passes it
   * on hover-capable devices (isHoverable).
   */
  revealOnHover?: boolean
  /** Where the staggered reveal starts: `start` under the amount, `end` when right-aligned in a header. */
  revealFrom?: 'start' | 'end'
  testID?: string
}

const HOVER_REVEAL_TRANSFORM = [{ translateY: -8 }, { scale: 0.95 }] as const
// Exit has no stagger delay.
const HOVER_REVEAL_EXIT_TRANSITION = 'opacity 200ms ease-out, transform 200ms ease-out'
const HOVER_REVEAL_STAGGER_MS = 40

const TOOLTIP_REST_MS = 20
const TOOLTIP_CLOSE_MS = 100
const TOOLTIP_MAX_WIDTH = 280

function getStaggeredGroupHoverStyle(index: number): {
  opacity: number
  transform: readonly { translateY: number }[]
  scale: number
  transition: string
} {
  const delay = index * HOVER_REVEAL_STAGGER_MS
  return {
    opacity: 1,
    transform: [{ translateY: 0 }],
    scale: 1,
    transition: `opacity 200ms ease-out ${delay}ms, transform 200ms ease-out ${delay}ms`,
  }
}

// The panel behind the chips has its own press. Only the web event bubbles to it.
function stopPropagation(event: Parameters<ButtonPressHandler>[0]): void {
  if ('stopPropagation' in event) {
    event.stopPropagation()
  }
}

function isMaxPercentage(percentage: AmountPresetPercentage): boolean {
  return percentage === 100 || percentage === 'max'
}

function usePresetButtonProps(appearance: AmountInputPresetsAppearance): ButtonProps {
  const media = useMedia()
  switch (appearance) {
    case 'large':
      return {
        variant: 'default',
        emphasis: 'tertiary',
        size: media.short ? 'xsmall' : 'small',
        borderRadius: '$roundedFull',
        fill: true,
        borderColor: '$surface3',
      }
    case 'branded':
      // Button has no borderWidth prop. The old lone Max had no border; the frame's 1px one would grow the chip 2px.
      return { variant: 'branded', emphasis: 'secondary', size: 'xxsmall', fill: false, style: { borderWidth: 0 } }
    case 'outlined':
    default:
      return {
        variant: 'default',
        emphasis: 'secondary',
        size: 'xxsmall',
        fill: false,
        py: '$spacing4',
        borderColor: '$surface3',
      }
  }
}

/**
 * Percentage chips that fill the amount from the balance: 25%, 50%, 75%, Max. Which
 * presets exist, whether each is enabled and what amount each sets all stay with the host.
 *
 * Rendered by CurrencyInputPanel (header, under the amount, or a lone Max by the balance)
 * and on its own above the native decimal pad and in the extension send token panel.
 * Replaces AmountInputPresets and PresetAmountButton's markup; the press event the old Trace
 * sent and the native MaxBalanceInfoModal stay in the adapter. The old chips also scaled to 1.02 on
 * hover and 0.99 on press; mycelium Button has no hover or press style props, so these
 * use its own press scale.
 */
export function AmountInputPresets({
  presets,
  onSelectPreset,
  onPressDisabledPreset,
  appearance = 'outlined',
  revealOnHover = false,
  revealFrom = 'start',
  testID,
}: AmountInputPresetsProps): JSX.Element {
  const { t } = useTranslation()
  const buttonProps = usePresetButtonProps(appearance)
  const isLarge = appearance === 'large'
  // A lone Max hugs its label: native grows a flex item into an unsized row's free width, web doesn't.
  const growsChips = appearance !== 'branded'

  return (
    <Flex
      row
      flex={isLarge ? 1 : undefined}
      gap={isLarge ? '$gap8' : '$gap4'}
      testID={testID}
      {...(revealOnHover
        ? {
            opacity: 0,
            transition: HOVER_REVEAL_EXIT_TRANSITION,
            '$group-hover': { opacity: 1, transition: 'opacity 100ms ease-in-out, transform 100ms ease-in-out' },
          }
        : {})}
    >
      {presets.map((preset, index) => {
        const staggerIndex = revealFrom === 'start' ? index : presets.length - index - 1
        const button = (
          <Button
            {...buttonProps}
            disabled={preset.disabled}
            testID={preset.testID}
            onDisabledPress={(event) => {
              stopPropagation(event)
              onPressDisabledPreset?.(preset.percentage)
            }}
            onPress={(event) => {
              stopPropagation(event)
              onSelectPreset(preset.percentage)
            }}
          >
            {isMaxPercentage(preset.percentage) ? t('swap.button.max') : `${preset.percentage}%`}
          </Button>
        )

        return (
          <Flex
            key={preset.percentage}
            grow={growsChips}
            $group-hover={revealOnHover ? getStaggeredGroupHoverStyle(staggerIndex) : undefined}
            opacity={revealOnHover ? 0 : undefined}
            transform={revealOnHover ? HOVER_REVEAL_TRANSFORM : undefined}
            transition={revealOnHover ? HOVER_REVEAL_EXIT_TRANSITION : undefined}
          >
            {preset.disabled && preset.disabledTooltip && AMOUNT_INPUT_PRESETS_STYLES.showDisabledTooltip ? (
              <DisabledPresetTooltip text={preset.disabledTooltip}>{button}</DisabledPresetTooltip>
            ) : (
              button
            )}
          </Flex>
        )
      })}
    </Flex>
  )
}

/**
 * The markup of the InfoTooltip that wrapped a disabled native-balance preset on web, wrappers,
 * arrow and nested text included, so the chip's box and the hovered tooltip render as before.
 */
function DisabledPresetTooltip({ text, children }: PropsWithChildren<{ text: string }>): JSX.Element {
  return (
    <Flex row shrink alignItems="center" gap="$spacing4">
      <Tooltip delay={{ close: TOOLTIP_CLOSE_MS, open: 0 }} placement="top" restMs={TOOLTIP_REST_MS}>
        <Flex shrink>
          <Tooltip.Trigger>{children}</Tooltip.Trigger>
          <Tooltip.Content maxWidth={TOOLTIP_MAX_WIDTH} mx="$spacing24" pointerEvents="auto">
            <Flex row alignItems="center" gap="$spacing8">
              <Flex shrink gap="$spacing4">
                <Text color="$neutral2" variant="body4">
                  <Text color="$neutral2" textAlign="left" variant="body4">
                    {text}
                  </Text>
                </Text>
              </Flex>
            </Flex>
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Flex>
      </Tooltip>
    </Flex>
  )
}
