import { PoolWarning } from 'components/addLiquidity/PoolWarning'
import { SupportArticleURL } from 'constants/supportArticles'
import { Trans } from 'react-i18next'

export function OutOfSyncWarning() {
  return (
    <PoolWarning
      title={<Trans>Pool out of sync</Trans>}
      subtitle={
        <Trans>
          This pool is out of sync with market prices. Adding liquidity at the suggested ratios may result in loss of
          funds.
        </Trans>
      }
      link={SupportArticleURL.IMPERMANENT_LOSS}
    />
  )
}
