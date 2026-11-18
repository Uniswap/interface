import {
  AnimatedFlex,
  type AnimatedFlexProps,
  Flex,
  spacing,
  Text,
  type TextProps,
  TouchableArea,
  useIsShortMobileDevice,
} from '@universe/mycelium'
import { ArrowDownArrowUp } from '@universe/mycelium/icons/ArrowDownArrowUp'
import type { TouchableAreaCompatEvent } from '@universe/mycelium/touchable-area'
import { AmountInput, type AmountInputProps } from '@universe/transactions-ui/src/common/AmountInput/AmountInput'
import {
  AmountInputPresets,
  type AmountInputPresetsProps,
} from '@universe/transactions-ui/src/common/AmountInputPresets/AmountInputPresets'
import {
  TokenSelectButton,
  type TokenSelectButtonProps,
  type TokenSelectButtonToken,
} from '@universe/transactions-ui/src/common/TokenSelectButton/TokenSelectButton'
import type { ReactNode } from 'react'

/** The amount field. The panel owns `disabled`, `onPressIn` and the error color. */
export type CurrencyInputPanelAmount = Omit<AmountInputProps, 'disabled' | 'onPressDisabled' | 'onPressIn'>

export interface CurrencyInputPanelBalance {
  /** Formatted: `1.2345`. Omit the whole prop to hide the balance (disconnected, empty output). */
  amount: string
  /** After the amount: `ETH`. */
  symbol?: string
  /** Fills the amount from the balance. Omit and the balance is plain text. */
  onPress?: () => void
}

/**
 * Where presets render. `header`: right of the label, desktop web and extension. `footer`:
 * in place of the fiat line while the amount is empty (mobile web, desktop without a
 * label). `balance`: a lone Max after the balance (mobile send). Header and footer presets
 * need a `balance`.
 */
export type CurrencyInputPanelPresetsPlacement = 'header' | 'footer' | 'balance'

export type CurrencyInputPanelPresets = Pick<
  AmountInputPresetsProps,
  'presets' | 'onSelectPreset' | 'onPressDisabledPreset' | 'revealOnHover'
> & { placement: CurrencyInputPanelPresetsPlacement }

export interface CurrencyInputPanelProps {
  /** Product copy: "Sell", "Buy", "Budget". */
  label?: string
  /** The selected token. Omit for the empty state: "Select token", a `0` placeholder, no footer. */
  token?: TokenSelectButtonToken
  /**
   * Opens the host's token selector: the token button, the empty `0`, and a press anywhere
   * on an empty panel. Omit it with a token set and the button renders as a static badge.
   */
  onPressSelectToken?: () => void
  /** Token button look. `hidden` drops it (Toucan max valuation). */
  tokenButton?: Pick<TokenSelectButtonProps, 'accent' | 'showChevron' | 'testID'> & { hidden?: boolean }
  amount: CurrencyInputPanelAmount
  /**
   * An amount is entered. Default: `amount.value` is non-empty. Footer presets give way to the
   * fiat line once there is one. A host whose shown text can differ from its parsed amount
   * (a lone `0` or `.` parses to none) passes its own.
   */
  hasAmount?: boolean
  /** The other unit, formatted: `$1,234.56`, or the token amount in fiat mode. Omit to hide (testnets). */
  fiatValue?: string
  /** The fiat line toggles fiat mode; the host decides, including when it cannot. */
  onPressFiatValue?: () => void
  /** A ⇅ glyph before the fiat line, cueing that pressing it flips token and fiat entry (margin). */
  showFiatToggleIcon?: boolean
  balance?: CurrencyInputPanelBalance
  /** The amount exceeds the balance: amount and balance paint critical. */
  isBalanceInsufficient?: boolean
  presets?: CurrencyInputPanelPresets
  /** Slot: the label row's right edge, in place of header presets, e.g. margin's fiat quick-picks. */
  headerAccessory?: ReactNode
  /** Blocks typing; presses go to `onPressDisabled` (the adapter shakes the input row). */
  disabled?: boolean
  onPressDisabled?: () => void
  /** A press on the panel or the input while a token is set, e.g. focusing this field. */
  onPressIn?: () => void
  /** Slot: quick-pick token chips for an empty output panel. */
  tokenOptions?: ReactNode
  /** `input` (default) replaces the `0`; `header` sits right of the label (desktop web). */
  tokenOptionsPlacement?: 'header' | 'input'
  /**
   * Slot: content under the input, e.g. the Toucan valuation slider. With an accessory the
   * panel stops clipping and drops its press scale, since the accessory has its own controls.
   */
  accessory?: ReactNode
  /** `compact`: the Toucan bid inputs: smaller amount and lines, tighter rows. */
  variant?: 'default' | 'compact'
  /** Paints the panel as a `$surface2` card. `top` squares the bottom corners for an attached card below (LP deposit). */
  card?: 'full' | 'top'
  /**
   * Adapter-owned animation on the input row, the shake on a disabled press today. It runs
   * on Reanimated on native, so the hook stays adapter side and only its style comes in.
   */
  inputRowAnimatedStyle?: AnimatedFlexProps['style']
  /**
   * The panel's press area is one accessibility element (default), which on iOS also hides
   * the token button and input inside it. E2e builds pass `false` to reach them.
   */
  accessible?: boolean
  testID?: string
}

const COMPACT_FONT_SIZE_RANGE = { max: 18, min: 12 }
const DEFAULT_PLACEHOLDER_FONT_SIZE = 36
const DEFAULT_INPUT_ROW_MIN_HEIGHT = 24 + spacing.spacing36
const COMPACT_INPUT_ROW_MIN_HEIGHT = 32

/**
 * The amount panel of every transaction form: label, amount input with the token button,
 * then the fiat line and the balance, with optional percentage presets. The token selector,
 * amount parsing, max-spend math, fiat conversion and the shake stay with the host.
 *
 * Rendered by swap (both sides), mobile send, LP deposit, Toucan bid inputs and the margin
 * form. Replaces the markup of CurrencyInputPanel, CurrencyInputPanelHeader,
 * CurrencyInputPanelInput, CurrencyInputPanelValue and CurrencyInputPanelBalance.
 *
 * Slots: `tokenOptions`, `headerAccessory` and `accessory` (3).
 */
export function CurrencyInputPanel({
  label,
  token,
  onPressSelectToken,
  tokenButton,
  amount,
  hasAmount,
  fiatValue,
  onPressFiatValue,
  showFiatToggleIcon = false,
  balance,
  isBalanceInsufficient = false,
  presets,
  headerAccessory,
  disabled = false,
  onPressDisabled,
  onPressIn,
  tokenOptions,
  tokenOptionsPlacement = 'input',
  accessory,
  variant = 'default',
  card,
  inputRowAnimatedStyle,
  accessible,
  testID,
}: CurrencyInputPanelProps): JSX.Element {
  const isShortMobileDevice = useIsShortMobileDevice()
  const isCompact = variant === 'compact'
  const isCard = card !== undefined
  const roundsBottom = card === 'full'
  // Compact too: the Toucan inputs asked for 12px through paddingVertical, which the panel's own py overrode.
  const panelPaddingY = isShortMobileDevice ? '$spacing8' : '$spacing16'

  return (
    <TouchableArea
      group
      accessible={accessible}
      disabledStyle={{ cursor: 'default' }}
      scaleTo={accessory ? 1 : undefined}
      testID={testID}
      onPress={disabled ? onPressDisabled : token ? onPressIn : onPressSelectToken}
    >
      <Flex
        backgroundColor={isCard ? '$surface2' : undefined}
        borderBottomLeftRadius={roundsBottom ? '$rounded20' : undefined}
        borderBottomRightRadius={roundsBottom ? '$rounded20' : undefined}
        borderTopLeftRadius={isCard ? '$rounded20' : undefined}
        borderTopRightRadius={isCard ? '$rounded20' : undefined}
        overflow={accessory ? 'visible' : 'hidden'}
        px="$spacing16"
        py={panelPaddingY}
      >
        {(label || tokenOptions || headerAccessory) && (
          <PanelHeader
            accessory={headerAccessory}
            label={label}
            presets={presets?.placement === 'header' && balance ? presets : undefined}
            tokenOptions={tokenOptionsPlacement === 'header' ? tokenOptions : undefined}
          />
        )}
        <PanelInputRow
          amount={amount}
          disabled={disabled}
          isBalanceInsufficient={isBalanceInsufficient}
          isCompact={isCompact}
          style={inputRowAnimatedStyle}
          token={token}
          tokenButton={tokenButton}
          tokenOptions={tokenOptionsPlacement === 'input' ? tokenOptions : undefined}
          onPressDisabled={onPressDisabled}
          onPressIn={onPressIn}
          onPressSelectToken={onPressSelectToken}
        />
        <PanelFooter
          balance={balance}
          disabled={disabled}
          fiatValue={fiatValue}
          isAmountEmpty={!(hasAmount ?? amount.value)}
          isBalanceInsufficient={isBalanceInsufficient}
          lineVariant={isCompact ? 'body4' : 'body3'}
          presets={presets}
          showFiatToggleIcon={showFiatToggleIcon}
          token={token}
          onPressDisabled={onPressDisabled}
          onPressFiatValue={onPressFiatValue}
        />
        {accessory ? <Flex mt={isCompact ? '$spacing8' : '$spacing24'}>{accessory}</Flex> : null}
      </Flex>
    </TouchableArea>
  )
}

function PanelHeader({
  label,
  presets,
  accessory,
  tokenOptions,
}: {
  label?: string
  presets?: CurrencyInputPanelPresets
  accessory?: ReactNode
  tokenOptions?: ReactNode
}): JSX.Element {
  return (
    <Flex row justifyContent="space-between">
      {/* $small (16px): subheading2 has no smaller size, which the old web render inherited as 16px. */}
      <Text color="$neutral2" fontSize="$small" variant="subheading2">
        {label}
      </Text>
      {(accessory || presets) && (
        <Flex position="absolute" right={0} top={-spacing.spacing2}>
          {accessory ?? (presets && <AmountInputPresets {...presets} revealFrom="end" />)}
        </Flex>
      )}
      {tokenOptions}
    </Flex>
  )
}

function PanelInputRow({
  token,
  amount,
  disabled,
  isBalanceInsufficient,
  isCompact,
  tokenButton,
  tokenOptions,
  style,
  onPressDisabled,
  onPressIn,
  onPressSelectToken,
}: Pick<
  CurrencyInputPanelProps,
  'token' | 'amount' | 'tokenButton' | 'tokenOptions' | 'onPressDisabled' | 'onPressIn' | 'onPressSelectToken'
> & {
  disabled: boolean
  isBalanceInsufficient: boolean
  isCompact: boolean
  style: CurrencyInputPanelProps['inputRowAnimatedStyle']
}): JSX.Element {
  const fontSizeRange = amount.fontSizeRange ?? (isCompact ? COMPACT_FONT_SIZE_RANGE : undefined)
  const placeholderFontSize = amount.fontSize ?? fontSizeRange?.max ?? DEFAULT_PLACEHOLDER_FONT_SIZE

  return (
    <AnimatedFlex
      row
      alignItems="center"
      justifyContent={token ? 'space-between' : 'flex-end'}
      minHeight={isCompact ? COMPACT_INPUT_ROW_MIN_HEIGHT : DEFAULT_INPUT_ROW_MIN_HEIGHT}
      py={isCompact ? '$none' : '$spacing8'}
      style={style}
    >
      {token ? (
        <AmountInput
          {...amount}
          disabled={disabled}
          fontSizeRange={fontSizeRange}
          state={isBalanceInsufficient ? 'error' : amount.state}
          onPressDisabled={onPressDisabled}
          onPressIn={onPressIn}
        />
      ) : (
        // Reports layout like the amount field it stands in for, so a host sizing the amount measures one box either way.
        <Flex fill grow row alignItems="center" minHeight={24} mr="$spacing8" onLayout={amount.onFieldLayout}>
          {tokenOptions ?? (
            <TouchableArea onPress={onPressSelectToken}>
              <Text
                color="$neutral3"
                fontSize={placeholderFontSize}
                lineHeight={placeholderFontSize}
                variant="heading2"
              >
                0
              </Text>
            </TouchableArea>
          )}
        </Flex>
      )}
      {!tokenButton?.hidden && (
        <Flex row alignItems="center">
          <TokenSelectButton
            accent={tokenButton?.accent}
            showChevron={tokenButton?.showChevron}
            testID={tokenButton?.testID}
            token={token}
            onPress={onPressSelectToken}
          />
        </Flex>
      )}
    </AnimatedFlex>
  )
}

function PanelFooter({
  token,
  isAmountEmpty,
  fiatValue,
  onPressFiatValue,
  showFiatToggleIcon,
  balance,
  isBalanceInsufficient,
  presets,
  disabled,
  onPressDisabled,
  lineVariant,
}: Pick<
  CurrencyInputPanelProps,
  'token' | 'fiatValue' | 'onPressFiatValue' | 'showFiatToggleIcon' | 'balance' | 'presets' | 'onPressDisabled'
> & {
  isAmountEmpty: boolean
  isBalanceInsufficient: boolean
  disabled: boolean
  lineVariant: TextProps['variant']
}): JSX.Element {
  const isFooterPlacement = presets?.placement === 'footer'
  const footerPresets = isFooterPlacement && balance && isAmountEmpty ? presets : undefined
  const balancePresets = presets?.placement === 'balance' ? presets : undefined

  return (
    <Flex
      row
      alignItems="center"
      mb={isFooterPlacement ? '$spacing6' : undefined}
      // Keeps the row's height while there is no token.
      opacity={token ? 1 : 0}
      pointerEvents={token ? 'auto' : 'none'}
    >
      {footerPresets ? (
        <Flex position="absolute">
          <AmountInputPresets {...footerPresets} revealFrom="start" />
        </Flex>
      ) : (
        <Flex fill row alignItems="center" justifyContent="space-between">
          <TouchableArea group="item" flexShrink={1} onPress={disabled ? onPressDisabled : onPressFiatValue}>
            {fiatValue !== undefined && (
              <Flex centered row shrink maxContent gap="$spacing4">
                {showFiatToggleIcon && fiatValue ? (
                  <ArrowDownArrowUp
                    $group-item-hover={{ color: '$neutral2Hovered' }}
                    color="$neutral3"
                    size="$icon.12"
                  />
                ) : null}
                <Text
                  $group-item-hover={{ color: '$neutral2Hovered' }}
                  color="$neutral2"
                  numberOfLines={1}
                  variant={lineVariant}
                >
                  {fiatValue}
                </Text>
              </Flex>
            )}
          </TouchableArea>
        </Flex>
      )}
      {token && (balance || balancePresets) && (
        <Flex row centered gap="$spacing4" justifyContent="flex-end" ml="auto">
          {balance && (
            <PanelBalance
              isInsufficient={isBalanceInsufficient}
              amount={balance.amount}
              symbol={balance.symbol}
              variant={lineVariant}
              onPress={disabled ? undefined : balance.onPress}
            />
          )}
          {balancePresets && <AmountInputPresets {...balancePresets} appearance="branded" />}
        </Flex>
      )}
    </Flex>
  )
}

function PanelBalance({
  amount,
  symbol,
  onPress,
  isInsufficient,
  variant,
}: CurrencyInputPanelBalance & { isInsufficient: boolean; variant: TextProps['variant'] }): JSX.Element {
  const color = isInsufficient ? '$statusCritical' : '$neutral2'
  const hoverColor = isInsufficient ? '$statusCriticalHovered' : '$neutral2Hovered'

  const balanceText = (
    <Text color={color} variant={variant} {...(onPress && { '$group-item-hover': { color: hoverColor } })}>
      {/* Separate text nodes, like the old balance: one joined string shapes a hair differently on web. */}
      {amount} {symbol}
    </Text>
  )

  if (!onPress) {
    return balanceText
  }

  return (
    <TouchableArea
      cursor="pointer"
      group="item"
      onPress={(event: TouchableAreaCompatEvent) => {
        // The panel behind the balance has its own press.
        event.stopPropagation()
        onPress()
      }}
    >
      <Flex row maxContent>
        {balanceText}
      </Flex>
    </TouchableArea>
  )
}
