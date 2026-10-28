import {
  Flex,
  Text,
  TouchableTextLink,
  type ColorTokens,
  type TextCompatProps as TextProps,
  type TouchableTextLinkProps,
} from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { Trans } from 'ui/src'
import { DISCLOSURE_URLS } from 'uniswap/src/components/disclosures/disclosures'

type DisclosuresBodyProps = {
  variant?: TextProps['variant']
  color?: ColorTokens
  linkColor?: TouchableTextLinkProps['color']
  paragraphGap?: '$spacing8' | '$spacing12' | '$spacing16'
}

export function DisclosuresBody({
  variant = 'body3',
  color = '$neutral2',
  linkColor = '$accent1',
  paragraphGap = '$spacing12',
}: DisclosuresBodyProps): JSX.Element {
  const { t } = useTranslation()
  const linkVariant = variant as TouchableTextLinkProps['variant']

  // Trans splices these into its children array, so each needs a key.
  const link = (key: string, href: string): JSX.Element => (
    <DisclosureLink key={key} href={href} variant={linkVariant} color={linkColor} />
  )

  // i18n keys stay literal so i18next-parser can extract them.
  return (
    <Flex gap={paragraphGap}>
      <Text variant={variant} color={color}>
        <Trans
          i18nKey="disclosures.products"
          components={{
            appLink: link('appLink', DISCLOSURE_URLS.app),
            unsupportedTokenPolicyLink: link('unsupportedTokenPolicyLink', DISCLOSURE_URLS.unsupportedTokenPolicy),
          }}
        />
      </Text>
      <Text variant={variant} color={color}>
        {t('disclosures.integrations')}
      </Text>
      <Text variant={variant} color={color}>
        <Trans
          i18nKey="disclosures.liquiditySources"
          components={{ tradeOptionsLink: link('tradeOptionsLink', DISCLOSURE_URLS.tradeOptions) }}
        />
      </Text>
      <Text variant={variant} color={color}>
        {t('disclosures.routing')}
      </Text>
      <Text variant={variant} color={color}>
        <Trans
          i18nKey="disclosures.autoRouterParameters"
          components={{ uniRouteLink: link('uniRouteLink', DISCLOSURE_URLS.uniRouteRepo) }}
        />
      </Text>
      <Text variant={variant} color={color}>
        {t('disclosures.defaultParameters')}
      </Text>
      <Text variant={variant} color={color}>
        {t('disclosures.slippage')}
      </Text>
      <Text variant={variant} color={color}>
        {t('disclosures.swapDeadline')}
      </Text>
      <Text variant={variant} color={color}>
        {t('disclosures.autoRouter')}
      </Text>
      <Text variant={variant} color={color}>
        {t('disclosures.gasFees')}
      </Text>
      <Text variant={variant} color={color}>
        {t('disclosures.maxBaseFee')}
      </Text>
      <Text variant={variant} color={color}>
        {t('disclosures.priorityFees')}
      </Text>
      <Text variant={variant} color={color}>
        {t('disclosures.gasLimit')}
      </Text>
      <Text variant={variant} color={color}>
        {t('disclosures.feeCalculation')}
      </Text>
      <Text variant={variant} color={color}>
        <Trans
          i18nKey="disclosures.customization"
          components={{
            slippageLink: link('slippageLink', DISCLOSURE_URLS.slippage),
            swapDeadlinesLink: link('swapDeadlinesLink', DISCLOSURE_URLS.swapDeadlines),
            tradeOptionsLink: link('tradeOptionsLink', DISCLOSURE_URLS.tradeOptions),
          }}
        />
      </Text>
    </Flex>
  )
}

function DisclosureLink({
  href,
  variant,
  color,
  children,
}: {
  href: string
  variant: TouchableTextLinkProps['variant']
  color: TouchableTextLinkProps['color']
  /** Injected by Trans: the link label from the translated string. */
  children?: string
}): JSX.Element {
  return (
    <TouchableTextLink onlyUseText link={href} color={color} variant={variant}>
      {children ?? ''}
    </TouchableTextLink>
  )
}
