import { ActionTileWithIconAnimation } from 'components/ActionTiles/ActionTileWithIconAnimation'
import { useTranslation } from 'react-i18next'
import { CreditCard } from 'ui/src/components/icons/CreditCard'
import { FlexProps } from 'ui/src/components/layout/Flex'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'

export function BuyActionTile({ padding = '$spacing12' }: { padding?: FlexProps['p'] }) {
  const { t } = useTranslation()
  const { navigateToFiatOnRamp } = useUniswapContext()

  const onPressBuy = useEvent(() => {
    navigateToFiatOnRamp({})
  })

  return (
    <ActionTileWithIconAnimation
      dataTestId={TestID.PortfolioActionTileBuy}
      Icon={CreditCard}
      name={t('common.button.buy')}
      onClick={onPressBuy}
      padding={padding}
    />
  )
}
