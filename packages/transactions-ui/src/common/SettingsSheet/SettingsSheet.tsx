import { Button, Flex, iconSizes, Text, TouchableArea } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { SETTINGS_SHEET_STYLES } from '@universe/transactions-ui/src/common/SettingsSheet/settingsSheetStyles'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface SettingsSheetProps {
  /** Slot: one SettingsSheetPage, or (web and extension) an AnimatedPager of two. */
  children: ReactNode
  testID?: string
}

/**
 * The transaction settings content: the padded frame inside the web popover, the
 * extension modal and the native bottom sheet. Content only; the popover, modal or sheet
 * around it stays in the adapter. Rendered by swap (every platform) and web Liquidity.
 *
 * It holds pages rather than rows because the old layout keeps a header and a Save button
 * per page: the mobile app and mobile web swap one page in place, web and extension slide
 * between two with AnimatedPager. Which one is a platform decision, so the adapter makes it.
 *
 * Replaces the outer frame of TransactionSettingsModalContent.
 */
export function SettingsSheet({ children, testID }: SettingsSheetProps): JSX.Element {
  return (
    <Flex
      gap="$spacing16"
      px={SETTINGS_SHEET_STYLES.framePx}
      py={SETTINGS_SHEET_STYLES.framePy}
      width="100%"
      testID={testID}
    >
      {children}
    </Flex>
  )
}

export interface SettingsSheetPageProps {
  /**
   * Header title, product copy ("Swap settings", "Transaction settings", or the open
   * setting's name). Omit it and no header renders: the host drops it at the top level on
   * desktop web and extension, and for a setting that hides its title.
   */
  title?: string
  /**
   * Press on the back chevron's spot, left of the title. The spot stays pressable while the
   * chevron is hidden, as in the old layout, where it went back to the list from the page
   * the sheet opened on.
   */
  onPressBack?: () => void
  /** Shows the back chevron. The host hides it at the top level and on the page the sheet opened on; it keeps its space either way. */
  showBackChevron?: boolean
  /** Slot: a SettingsRowList of SettingsRows, or the open setting's screen. */
  children: ReactNode
  /**
   * Shows the Save button, which closes the sheet (settings apply as they change). The host
   * omits it on desktop web, where the popover closes on an outside click.
   */
  onClose?: () => void
}

/**
 * One page of the settings sheet: the title row with its back chevron, the page content,
 * and the Save button.
 *
 * Replaces SettingsPageLayout in TransactionSettingsModalContent. The title and close
 * visibility rules (isMobileApp, media.sm, isWebAppDesktop) move to the adapter, which
 * passes `title` and `onClose` only where the old layout showed them.
 */
export function SettingsSheetPage({
  title,
  onPressBack,
  showBackChevron = false,
  children,
  onClose,
}: SettingsSheetPageProps): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()

  return (
    <Flex gap="$spacing16">
      {title !== undefined && (
        <Flex row justifyContent="space-between" pt={SETTINGS_SHEET_STYLES.titlePt}>
          <TouchableArea onPress={onPressBack}>
            <RotatableChevron color={showBackChevron ? '$neutral3' : '$transparent'} size="$icon.24" />
          </TouchableArea>
          <Text textAlign="center" variant="body1">
            {title}
          </Text>
          <Flex width={iconSizes.icon24} />
        </Flex>
      )}
      {children}
      {onClose && (
        <Flex centered row pb={media.sm ? SETTINGS_SHEET_STYLES.smallScreenSaveButtonPb : '$spacing8'}>
          {/* Id kept from the old layout so the DOM stays the same; no test selects it today. */}
          <Button testID="swap-settings-close" emphasis="secondary" onPress={onClose}>
            {t('common.button.save')}
          </Button>
        </Flex>
      )}
    </Flex>
  )
}
