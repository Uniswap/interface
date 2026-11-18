import { Flex, iconSizes, spacing, Text, TouchableArea, type TouchableAreaProps, validColor } from '@universe/mycelium'
import { PRESS_SCALE } from '@universe/mycelium/button-compat'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { TokenLogo, type TokenLogoProps } from '@universe/transactions-ui/src/common/TokenLogo/TokenLogo'
import { TOKEN_SELECT_BUTTON_STYLES } from '@universe/transactions-ui/src/common/TokenSelectButton/tokenSelectButtonStyles'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export interface TokenSelectButtonToken {
  /** Display symbol, already truncated (getSymbolDisplayText). */
  symbol: string
  /** The logo, as TokenLogo props. The button sets the size. */
  logo: Omit<TokenLogoProps, 'size' | 'isLoading' | 'testID'>
}

/** "Select token" state only: the pill takes a token's color instead of the accent. */
export interface TokenSelectButtonAccent {
  /** A raw color, normally the other side's token color. Invalid colors fall back to `$accent1`. */
  color: string
  /** The adapter picks the contrast-passing one (getContrastPassingTextColor). */
  textColor: '$white' | '$black'
}

export interface TokenSelectButtonProps {
  /** The selected token. Omit for the "Select token" state. */
  token?: TokenSelectButtonToken
  /**
   * Reports the press; the host opens its token selector. Omit it with a token set and
   * the button renders as a static logo and symbol (LP deposit, Toucan budget).
   */
  onPress?: () => void
  accent?: TokenSelectButtonAccent
  /** The down chevron after the label. Product rule: only the desktop web app shows it. */
  showChevron?: boolean
  /** On the pill, and as `<testID>-label` on the label. The static badge carries only the label one. */
  testID?: string
}

const LOGO_SIZE = iconSizes.icon28
const HOVER_BRIGHTNESS_DELTA = 0.05

/**
 * The pill that shows the chosen token and opens the token selector: logo and symbol, or
 * "Select token". The selector modal stays with the host; this only reports the press.
 *
 * Replaces SelectTokenButton (CurrencyInputPanel), which swap, send, LP deposit, Toucan
 * and margin (form and MarginPayWith) render today.
 */
export const TokenSelectButton = memo(function TokenSelectButtonInner({
  token,
  onPress,
  accent,
  showChevron = false,
  testID,
}: TokenSelectButtonProps): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const labelTestID = testID ? `${testID}-label` : undefined

  if (!onPress && token) {
    return (
      <Flex centered row gap="$spacing4" p="$spacing4" pr={TOKEN_SELECT_BUTTON_STYLES.badgePr}>
        <TokenLogo {...token.logo} size={LOGO_SIZE} />
        <Text color="$neutral1" pl="$spacing4" testID={labelTestID} variant="buttonLabel1">
          {token.symbol}
        </Text>
      </Flex>
    )
  }

  const accentColor = token ? undefined : validColor(accent?.color)
  const textColor = token ? '$neutral1' : accentColor ? (accent?.textColor ?? '$white') : '$white'
  const chevronColor = token ? '$neutral2' : textColor
  const hoverStyle: TouchableAreaProps['hoverStyle'] = {
    backgroundColor: token ? '$surface1Hovered' : (accentColor ?? '$accent1Hovered'),
    // A raw token color has no hovered twin, so hover shifts its brightness instead.
    filter: accentColor
      ? `brightness(${isDarkMode ? 1 + HOVER_BRIGHTNESS_DELTA : 1 - HOVER_BRIGHTNESS_DELTA})`
      : undefined,
  }

  return (
    <TouchableArea
      backgroundColor={token ? '$surface1' : (accentColor ?? '$accent1')}
      borderColor="$surface3Solid"
      borderRadius="$roundedFull"
      borderWidth="$spacing1"
      hoverStyle={hoverStyle}
      hoverable={!!token}
      scaleTo={PRESS_SCALE}
      shadowColor="$surface3"
      shadowOpacity={0.04}
      shadowRadius={10}
      testID={testID}
      onPress={onPress}
    >
      <Flex centered row gap="$spacing6" height="$spacing36" px="$spacing12">
        {token && (
          <Flex ml={-spacing.spacing8}>
            <TokenLogo {...token.logo} size={LOGO_SIZE} />
          </Flex>
        )}
        <Text color={textColor} testID={labelTestID} variant="buttonLabel2">
          {token ? token.symbol : t('tokens.selector.button.choose')}
        </Text>
        {showChevron && (
          <RotatableChevron color={chevronColor} direction="down" mx={-spacing.spacing2} size="$icon.24" />
        )}
      </Flex>
    </TouchableArea>
  )
})
