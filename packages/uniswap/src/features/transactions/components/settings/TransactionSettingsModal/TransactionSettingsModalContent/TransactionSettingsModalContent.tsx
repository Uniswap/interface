import { isExtensionApp, isMobileApp, isMobileWeb, isWebAppDesktop, isWebPlatform } from '@universe/environment'
import { AnimatedPager } from '@universe/mycelium/animate-presence-pager'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { SettingsRowList, SettingsSheet, SettingsSheetPage } from '@universe/transactions-ui'
import { PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionSettingRow } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModalContent/TransactionSettingsRow'
import type { TransactionSettingsModalProps } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/types'
import { type TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'

const TopLevelSettings = ({
  settings,
  setSelectedSetting,
}: {
  settings: TransactionSettingConfig[]
  setSelectedSetting: React.Dispatch<React.SetStateAction<TransactionSettingConfig | undefined>>
}): JSX.Element => {
  return (
    <SettingsRowList>
      {settings.map((setting, index) => {
        return (
          <TransactionSettingRow
            key={`swap-setting-${index}`}
            setSelectedSetting={setSelectedSetting}
            setting={setting}
          />
        )
      })}
    </SettingsRowList>
  )
}

interface SettingsPageLayoutProps {
  SelectedSetting: TransactionSettingConfig | undefined
  setSelectedSetting: React.Dispatch<React.SetStateAction<TransactionSettingConfig | undefined>>
  initialSelectedSetting: TransactionSettingConfig | undefined
  defaultTitle?: string
  onClose?: () => void
}

const SettingsPageLayout = ({
  children,
  SelectedSetting,
  setSelectedSetting,
  initialSelectedSetting,
  defaultTitle,
  onClose,
}: PropsWithChildren<SettingsPageLayoutProps>): JSX.Element => {
  const { t } = useTranslation()
  const media = useMedia()

  const title = SelectedSetting ? SelectedSetting.renderTitle(t) : (defaultTitle ?? t('swap.settings.title'))

  // For selected settings, show title on all platforms unless it is explicitly hidden via hideTitle.
  // For top level settings (not selected), show title on mobile + small screen web only.
  const isWebSmallScreen = media.sm && isWebPlatform
  const shouldShowTitle = SelectedSetting
    ? !SelectedSetting.hideTitle
    : isMobileApp || (isWebSmallScreen && !isExtensionApp)

  // Hide close button on desktop web
  const shouldShowCloseButton = !isWebAppDesktop && onClose

  const onPressBack = useCallback((): void => setSelectedSetting(undefined), [setSelectedSetting])

  return (
    <SettingsSheetPage
      title={shouldShowTitle ? title : undefined}
      showBackChevron={SelectedSetting !== undefined && SelectedSetting !== initialSelectedSetting}
      onPressBack={onPressBack}
      onClose={shouldShowCloseButton ? onClose : undefined}
    >
      {children}
    </SettingsSheetPage>
  )
}

export const TransactionSettingsModalContent = ({
  settings,
  defaultTitle,
  initialSelectedSetting,
  onClose,
}: Omit<TransactionSettingsModalProps, 'isOpen'>): JSX.Element => {
  const [SelectedSetting, setSelectedSetting] = useState<TransactionSettingConfig | undefined>(initialSelectedSetting)

  const layoutProps = useMemo(
    () => ({
      defaultTitle,
      SelectedSetting,
      setSelectedSetting,
      initialSelectedSetting,
      onClose,
    }),
    [defaultTitle, SelectedSetting, initialSelectedSetting, onClose],
  )

  const renderContent = useCallback((): JSX.Element => {
    if (SelectedSetting?.Screen) {
      return <SelectedSetting.Screen />
    }
    return <TopLevelSettings settings={settings} setSelectedSetting={setSelectedSetting} />
  }, [SelectedSetting, settings])

  return (
    <SettingsSheet>
      {isMobileApp || isMobileWeb ? (
        // Mobile: Single page with conditional content
        <SettingsPageLayout {...layoutProps}>{renderContent()}</SettingsPageLayout>
      ) : (
        // Desktop: Animated pager with two pages
        <AnimatedPager currentIndex={SelectedSetting?.Screen ? 1 : 0} curve="fast">
          <SettingsPageLayout {...layoutProps}>
            <TopLevelSettings settings={settings} setSelectedSetting={setSelectedSetting} />
          </SettingsPageLayout>
          <SettingsPageLayout {...layoutProps}>
            {SelectedSetting?.Screen && <SelectedSetting.Screen />}
          </SettingsPageLayout>
        </AnimatedPager>
      )}
    </SettingsSheet>
  )
}
