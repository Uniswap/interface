import { useTranslation } from 'react-i18next'
import { NetworkCostPicker } from 'uniswap/src/features/gas/components/NetworkCostPicker'
import {
  useEnableCustomGasFeeEntry,
  useSetEnableCustomGasFeeEntry,
} from 'uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry'
import { useEvent } from 'utilities/src/react/hooks'
import { SlideOutMenu } from '~/components/AccountDrawer/SlideOutMenu'

export function NetworkCostMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const enableCustomGasFeeEntry = useEnableCustomGasFeeEntry()
  const setEnableCustomGasFeeEntry = useSetEnableCustomGasFeeEntry()

  const handleChange = useEvent((enabled: boolean) => {
    setEnableCustomGasFeeEntry(enabled)
    onClose()
  })

  return (
    <SlideOutMenu title={t('gas.override.title')} onClose={onClose}>
      <NetworkCostPicker enableCustomGasFeeEntry={enableCustomGasFeeEntry} onChange={handleChange} />
    </SlideOutMenu>
  )
}
