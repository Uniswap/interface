import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex } from 'ui/src'
import { Wrench } from 'ui/src/components/icons/Wrench'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { SettingsToggle } from '~/components/AccountDrawer/SettingsToggle'
import { useModalState } from '~/hooks/useModalState'
export function TestnetsToggle() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { openModal: openTestnetModal, closeModal: closeTestnetModal } = useModalState(ModalName.TestnetMode)

  return (
    <SettingsToggle
      icon={
        <Flex centered width="$icon.24" height="$icon.24">
          <Wrench size="$icon.18" color="$neutral2" />
        </Flex>
      }
      title={t('settings.setting.wallet.testnetMode.title')}
      dataid={TestID.TestnetsToggle}
      isActive={isTestnetModeEnabled}
      toggle={() => {
        const nextIsTestnetModeEnabled = !isTestnetModeEnabled
        if (nextIsTestnetModeEnabled) {
          openTestnetModal()
        } else {
          closeTestnetModal()
        }
        dispatch(setIsTestnetModeEnabled(nextIsTestnetModeEnabled))
      }}
    />
  )
}
