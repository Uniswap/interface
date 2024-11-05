import { InterfaceModalName } from '@uniswap/analytics-events'
import { LaunchModal } from 'components/TopLevelModals/LaunchModal'
import { UNICHAIN_LOGO } from 'ui/src/assets'
import { AstroChainConfigKey, DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { useTranslation } from 'uniswap/src/i18n'

const DESKTOP_IMAGE = '/images/unichain/unichain_modal_desktop.png'
const MOBILE_IMAGE = '/images/unichain/unichain_modal_mobile.png'

export function UnichainLaunchModal() {
  const { t } = useTranslation()
  const url = useDynamicConfigValue(DynamicConfigs.AstroChain, AstroChainConfigKey.Url, '' as string)

  return (
    <LaunchModal
      interfaceModalName={InterfaceModalName.ASTRO_CHAIN_LAUNCH_MODAL}
      learnMoreUrl={url}
      desktopImage={DESKTOP_IMAGE}
      mobileImage={MOBILE_IMAGE}
      logo={UNICHAIN_LOGO}
      title={t('unichain.launch.modal.title')}
      description={t('unichain.launch.modal.description')}
    />
  )
}
