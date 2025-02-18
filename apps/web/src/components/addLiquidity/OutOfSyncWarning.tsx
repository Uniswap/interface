import { PoolWarning } from 'components/addLiquidity/PoolWarning'
import { Trans } from 'react-i18next'
import { uniswapUrls } from 'uniswap/src/constants/urls'

export function OutOfSyncWarning() {
  return (
    <PoolWarning
      title={<Trans i18nKey="pool.liquidity.outOfSync" />}
      subtitle={<Trans i18nKey="pool.liquidity.outOfSync.message" />}
      link={uniswapUrls.helpArticleUrls.impermanentLoss}
    />
  )
}
