import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useModalState } from 'hooks/useModalState'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
export function TestnetsToggle() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { openModal: openTestnetModal } = useModalState(ModalName.TestnetMode)

  return (
    <SettingsToggle
      title={t('settings.setting.wallet.testnetMode.title')}
      dataid={TestID.TestnetsToggle}
      isActive={isTestnetModeEnabled}
      toggle={() => {
        const nextIsTestnetModeEnabled = !isTestnetModeEnabled
        if (nextIsTestnetModeEnabled) {
          openTestnetModal()
        }
        dispatch(setIsTestnetModeEnabled(nextIsTestnetModeEnabled))
      }}
    />
  )
}
