import { PoolWarning } from 'components/addLiquidity/PoolWarning'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Trans } from 'uniswap/src/i18n'

export function TokenTaxV3Warning() {
  return (
    <PoolWarning
      title={<Trans i18nKey="pool.liquidity.taxWarning" />}
      subtitle={<Trans i18nKey="pool.liquidity.taxWarning.message" />}
      link={uniswapUrls.helpArticleUrls.feeOnTransferHelp}
    />
  )
}
