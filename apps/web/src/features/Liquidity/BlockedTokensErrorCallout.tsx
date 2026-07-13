import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ErrorCallout } from '~/components/ErrorCallout'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

export const BlockedTokensErrorCallout = ({ blockedTokenSymbols }: { blockedTokenSymbols: string[] }) => {
  const { t } = useTranslation()

  if (blockedTokenSymbols.length === 0) {
    return null
  }

  return (
    <ErrorCallout
      errorMessage={true}
      title={
        blockedTokenSymbols.length > 1
          ? t('token.safety.blocked.title.tokensNotAvailable', {
              tokenSymbol0: blockedTokenSymbols[0],
              tokenSymbol1: blockedTokenSymbols[1],
            })
          : t('token.safety.blocked.title.tokenNotAvailable', { tokenSymbol: blockedTokenSymbols[0] })
      }
      description={
        <>
          {blockedTokenSymbols.length > 1
            ? t('token.safety.warning.blocked.description.default_other')
            : t('token.safety.warning.blocked.description.default_one')}{' '}
          <Text
            color="$neutral1"
            variant="body3"
            onPress={() => window.open(UniswapHelpUrls.articles.tokenWarning, '_blank', 'noopener,noreferrer')}
            {...ClickableTamaguiStyle}
          >
            {t('common.button.learn')}
          </Text>
        </>
      }
    />
  )
}
