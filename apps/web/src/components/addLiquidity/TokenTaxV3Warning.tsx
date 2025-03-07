import { PoolWarning } from 'components/addLiquidity/PoolWarning'
import { Trans } from 'react-i18next'
import { uniswapUrls } from 'uniswap/src/constants/urls'

export function TokenTaxV3Warning() {
  return (
    <PoolWarning
      title={<Trans i18nKey="pool.liquidity.taxWarning" />}
      subtitle={<Trans i18nKey="pool.liquidity.taxWarning.message" />}
      link={uniswapUrls.helpArticleUrls.feeOnTransferHelp}
    />
  )
}
