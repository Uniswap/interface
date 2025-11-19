import { ActionTileWithIconAnimation } from 'components/ActionTiles/ActionTileWithIconAnimation'
import { useTranslation } from 'react-i18next'
import { Bank } from 'ui/src/components/icons/Bank'
import { FlexProps } from 'ui/src/components/layout/Flex'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'

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
