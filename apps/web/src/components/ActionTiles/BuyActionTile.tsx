import type { FlexCompatProps as FlexProps } from '@universe/mycelium'
import { Bank } from '@universe/mycelium/icons/Bank'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { ActionTileWithIconAnimation } from '~/components/ActionTiles/ActionTileWithIconAnimation'

export function BuyActionTile({ padding = '$spacing12' }: { padding?: FlexProps['p'] }) {
  const { t } = useTranslation()
  const { navigateToFiatOnRamp } = useUniswapContext()

  const onPressBuy = useEvent(() => {
    navigateToFiatOnRamp({})
  })

  return (
    <Trace logPress element={ElementName.PortfolioActionBuy}>
      <ActionTileWithIconAnimation
        dataTestId={TestID.PortfolioActionTileBuy}
        Icon={Bank}
        name={t('common.button.buy')}
        onClick={onPressBuy}
        padding={padding}
      />
    </Trace>
  )
}
