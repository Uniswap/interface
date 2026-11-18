import type { ErrorViewStyles } from '@universe/transactions-ui/src/common/ErrorView/errorViewStyles'

/**
 * @internal Web and extension values; native values live in errorViewStyles.native.ts.
 * Same layout and interaction everywhere, tuned per platform as WarningModalContent did
 * with isWebPlatform. The padding lives here, not in `$platform-native`, because
 * FlexCompat's native leg drops that pool.
 */
export const ERROR_VIEW_STYLES: ErrorViewStyles = {
  paddingX: '$none',
  paddingBottom: '$none',
  titleVariant: 'subheading2',
  buttonSize: 'small',
  learnMoreHoverStyle: { color: '$accent1Hovered' },
}
