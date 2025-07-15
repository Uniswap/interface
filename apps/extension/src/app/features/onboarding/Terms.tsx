import { PropsWithChildren } from 'react'
import { Trans } from 'react-i18next'
import { Link, LinkProps } from 'react-router'
import { Text } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'

export function Terms(): JSX.Element {
  return (
    <Text color="$neutral3" textAlign="center" variant="body4">
      <Trans
        components={{
          highlightTerms: <LinkWrapper to={uniswapUrls.termsOfServiceUrl} />,
          highlightPrivacy: <LinkWrapper to={uniswapUrls.privacyPolicyUrl} />,
        }}
        i18nKey="onboarding.termsOfService"
      />
    </Text>
  )
}

function LinkWrapper(props: PropsWithChildren<LinkProps>): JSX.Element {
  const { children, ...rest } = props
  return (
    <Link {...rest} style={{ textDecoration: 'none' }} target="_blank">
      <Text color="$neutral2" variant="body4">
        {children}
      </Text>
    </Link>
  )
}
