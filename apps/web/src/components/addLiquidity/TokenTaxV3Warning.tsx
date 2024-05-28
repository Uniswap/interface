import { PoolWarning } from 'components/addLiquidity/PoolWarning'
import { SupportArticleURL } from 'constants/supportArticles'
import { Trans } from 'react-i18next'

export function TokenTaxV3Warning() {
  return (
    <PoolWarning
      title={<Trans>Token taxes</Trans>}
      subtitle={
        <Trans>
          One or more of these tokens have taxes on transfers. Adding liquidity with V3 may result in loss of funds. Try
          using V2 instead.
        </Trans>
      }
      link={SupportArticleURL.TOKEN_FEE_ON_TRANSFER}
    />
  )
}
