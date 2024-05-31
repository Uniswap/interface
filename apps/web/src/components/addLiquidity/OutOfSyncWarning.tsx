import { PoolWarning } from 'components/addLiquidity/PoolWarning'
import { SupportArticleURL } from 'constants/supportArticles'
import { Trans } from 'react-i18next'

export function OutOfSyncWarning() {
  return (
    <PoolWarning
      title={<Trans i18nKey="pool.liquidity.outOfSync" />}
      subtitle={<Trans i18nKey="pool.liquidity.outOfSync.message" />}
      link={SupportArticleURL.IMPERMANENT_LOSS}
    />
  )
}
