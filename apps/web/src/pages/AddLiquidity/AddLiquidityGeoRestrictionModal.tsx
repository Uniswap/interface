import { Text, TouchableArea, useSporeColors } from '@universe/mycelium'
import { Globe } from '@universe/mycelium/icons/Globe'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'

/**
 * LP counterpart of swap's restricted `GeoRestrictionModal` (same layout, LP copy). Opens when the pool
 * route lands on a restricted pair, so the pool stays visible and only the action is blocked. Reads
 * the same pair the deposit CTA gates on, so the modal and the disabled CTA can't disagree. Opens late
 * if the check resolves after mount (the hook fails open while in flight); once closed it stays closed
 * for the visit. Informational only: closing it leaves the form readable while its CTA stays disabled.
 */
export function AddLiquidityGeoRestrictionModal(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const {
    currencies: {
      display: { TOKEN0, TOKEN1 },
    },
  } = useCreateLiquidityContext()
  const { isGeoRestricted, restrictedTokenSymbol } = useLPGeoRestriction({ token0: TOKEN0, token1: TOKEN1 })
  const { value: isDismissed, setTrue: dismiss } = useBooleanState(false)

  const title = restrictedTokenSymbol
    ? t('liquidity.geoRestriction.banner.heading', { tokenSymbol: restrictedTokenSymbol })
    : t('liquidity.geoRestriction.banner.headingGeneric')

  const openGeoRestrictionHelp = (): Promise<void> => openUri({ uri: UniswapHelpUrls.articles.geoRestriction })

  return (
    <WarningModal
      isOpen={isGeoRestricted && !isDismissed}
      modalName={ModalName.LpGeoRestriction}
      severity={WarningSeverity.None}
      backgroundIconColor={colors.surface3.val}
      icon={<Globe color="$neutral1" size="$icon.24" />}
      title={title}
      caption={t('liquidity.geoRestriction.banner.description')}
      acknowledgeText={t('common.button.close')}
      acknowledgeButtonEmphasis="secondary"
      onClose={dismiss}
      onAcknowledge={dismiss}
    >
      <TouchableArea onPress={openGeoRestrictionHelp}>
        <Text color="$neutral1" mt="$spacing4" textAlign="center" variant="buttonLabel3">
          {t('common.button.learn')}
        </Text>
      </TouchableArea>
    </WarningModal>
  )
}
