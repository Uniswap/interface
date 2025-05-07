import { AnalyticsToggle } from 'components/AccountDrawer/AnalyticsToggle'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { TestnetsToggle } from 'components/AccountDrawer/TestnetsToggle'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useAccount } from 'hooks/useAccount'
import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useOpenModal } from 'state/application/hooks'
import { ThemedText } from 'theme/components'
import ThemeToggle from 'theme/components/ThemeToggle'
import { Flex, Text } from 'ui/src'
import { LockedDocument } from 'ui/src/components/icons/LockedDocument'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguage, useLanguageInfo } from 'uniswap/src/features/language/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const Container = styled(Column)`
  height: 100%;
  justify-content: space-between;
`

const StyledChevron = styled(ChevronRight)`
  color: ${({ theme }) => theme.neutral2};
`

const LanguageLabel = styled(Row)`
  white-space: nowrap;
`

const SettingsButton = ({
  title,
  currentState,
  onClick,
  testId,
  showArrow = true,
}: {
  title: ReactNode
  currentState?: ReactNode
  onClick: () => void
  testId?: string
  showArrow?: boolean
}) => (
  <Flex row justifyContent="space-between" py="$padding12" onPress={onClick} testID={testId}>
    <Text variant="body3" color="$neutral1">
      {title}
    </Text>
    <LanguageLabel gap="xs" align="center" width="min-content">
      {currentState && <ThemedText.LabelSmall color="neutral2">{currentState}</ThemedText.LabelSmall>}
      {showArrow && <StyledChevron size={20} />}
    </LanguageLabel>
  </Flex>
)

export default function SettingsMenu({
  onClose,
  openLanguageSettings,
  openLocalCurrencySettings,
  openPasskeySettings,
  openPortfolioBalanceSettings,
}: {
  onClose: () => void
  openLanguageSettings: () => void
  openLocalCurrencySettings: () => void
  openPasskeySettings: () => void
  openPortfolioBalanceSettings: () => void
}) {
  const { t } = useTranslation()
  const activeLanguage = useCurrentLanguage()
  const activeLocalCurrency = useAppFiatCurrency()
  const languageInfo = useLanguageInfo(activeLanguage)
  const openRecoveryPhraseModal = useOpenModal({ name: ModalName.RecoveryPhrase })
  const connectedWithEmbeddedWallet =
    useAccount().connector?.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID

  return (
    <SlideOutMenu title={<Trans i18nKey="common.settings" />} onClose={onClose}>
      <Container>
        <Flex gap="$gap12">
          <ThemeToggle />

          <SettingsButton
            title={t('settings.setting.currency.title')}
            currentState={activeLocalCurrency}
            onClick={openLocalCurrencySettings}
            testId="local-currency-settings-button"
          />
          <SettingsButton
            title={t('common.language')}
            currentState={languageInfo.displayName}
            onClick={openLanguageSettings}
            testId="language-settings-button"
          />
          <SettingsButton
            title={t('settings.setting.smallBalances.title')}
            onClick={openPortfolioBalanceSettings}
            testId="portfolio-balance-settings-button"
          />
          {connectedWithEmbeddedWallet && (
            <SettingsButton
              title={t('settings.setting.passKey.title')}
              currentState={<Passkey color="$neutral1" size="$icon.24" />}
              onClick={openPasskeySettings}
            />
          )}
          {connectedWithEmbeddedWallet && (
            <SettingsButton
              title={t('settings.setting.connectedWithEmbeddedWallet.title')}
              currentState={<LockedDocument size="$icon.24" />}
              onClick={openRecoveryPhraseModal}
            />
          )}
        </Flex>
        <TestnetsToggle />
        <AnalyticsToggle />
      </Container>
    </SlideOutMenu>
  )
}
