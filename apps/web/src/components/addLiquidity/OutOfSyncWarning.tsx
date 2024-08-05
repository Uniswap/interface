import { PoolWarning } from 'components/addLiquidity/PoolWarning'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Trans } from 'uniswap/src/i18n'

export function OutOfSyncWarning() {
  return (
    <PoolWarning
      title={<Trans i18nKey="pool.liquidity.outOfSync" />}
      subtitle={<Trans i18nKey="pool.liquidity.outOfSync.message" />}
      link={uniswapUrls.helpArticleUrls.impermanentLoss}
    />
  )
}
