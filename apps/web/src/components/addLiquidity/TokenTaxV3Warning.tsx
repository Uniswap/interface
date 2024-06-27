import { PoolWarning } from 'components/addLiquidity/PoolWarning'
import { SupportArticleURL } from 'constants/supportArticles'
import { Trans } from 'react-i18next'

export function TokenTaxV3Warning() {
  return (
    <PoolWarning
      title={<Trans i18nKey="pool.liquidity.taxWarning" />}
      subtitle={<Trans i18nKey="pool.liquidity.taxWarning.message" />}
      link={SupportArticleURL.TOKEN_FEE_ON_TRANSFER}
    />
  )
}
