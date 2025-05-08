import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useOpenModal } from 'state/application/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function TestnetsToggle() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()
  const openTestnetModal = useOpenModal({ name: ModalName.TestnetMode })

  return (
    <SettingsToggle
      title={t('settings.setting.wallet.testnetMode.title')}
      dataid="testnets-toggle"
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
