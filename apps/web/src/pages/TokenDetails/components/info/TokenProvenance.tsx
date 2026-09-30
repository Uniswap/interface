import { Anchor, Flex, Text, TouchableArea, UniversalImage } from '@universe/mycelium'
import { CheckmarkCircle } from '@universe/mycelium/icons/CheckmarkCircle'
import { Person } from '@universe/mycelium/icons/Person'
import { UniswapLogo } from '@universe/mycelium/icons/UniswapLogo'
import { TestID } from '@universe/test'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FORMAT_DATE_MEDIUM, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { NumberType } from 'utilities/src/format/types'
import { getAuctionLaunchMethod, getAuctionLaunchMethodCopy } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import { AuctionLaunchMethodIcon } from '~/features/Toucan/Shared/AuctionLaunchMethodIcon'
import { LaunchMethodExplainerModal } from '~/features/Toucan/Shared/LaunchMethodExplainerModal'
import { getTokenProvenanceData } from '~/pages/TokenDetails/components/info/tokenProvenanceData'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'

const UNISWAP_LAUNCHPAD_NAME = 'Uniswap'

function ProvenanceCell({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <Flex flexBasis="33.33%" minWidth={0} gap="$spacing4" pr="$spacing16" $sm={{ flexBasis: '50%' }}>
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      {children}
    </Flex>
  )
}

function CreatorAvatar({ avatarUrl }: { avatarUrl: string | undefined }): JSX.Element {
  return (
    <Flex
      width={20}
      height={20}
      borderRadius="$roundedFull"
      backgroundColor="$surface3"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      flexShrink={0}
    >
      {avatarUrl ? (
        <UniversalImage uri={avatarUrl} size={{ width: 20, height: 20 }} />
      ) : (
        <Person size="$icon.12" color="$neutral2" />
      )}
    </Flex>
  )
}

/**
 * Provenance rows for tokens launched through a Uniswap auction. Renders nothing unless the TDP
 * resolved an auction, so a missing or failed lookup never affects the rest of the page.
 */
export function TokenProvenance(): JSX.Element | null {
  const [isExplainerOpen, setIsExplainerOpen] = useState(false)
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const localizedDayjs = useLocalizedDayjs()
  const { auction, chainId, phase, currencyRaised } = useTokenDetailsAuctionDisplay()

  if (!auction || chainId === undefined) {
    return null
  }

  const method = getAuctionLaunchMethod({ auction })
  const { creator, launchDate, raised } = getTokenProvenanceData({
    auction,
    chainId,
    phase,
    currencyRaised,
  })

  return (
    <Flex testID={TestID.TokenDetailsProvenance} gap="$gap20" width="100%" $md={{ gap: '$gap16' }}>
      <Text variant="heading3">{t('toucan.auction.info')}</Text>
      <Flex row flexWrap="wrap" rowGap="$spacing16">
        <ProvenanceCell label={t('tdp.provenance.createdBy')}>
          <Flex row gap="$spacing8" alignItems="center" minWidth={0}>
            <CreatorAvatar avatarUrl={creator.avatarUrl} />
            {creator.href ? (
              <Anchor
                href={creator.href}
                target="_blank"
                rel="noopener noreferrer"
                variant="subheading1"
                color="$neutral1"
                textDecorationLine="none"
                numberOfLines={1}
              >
                {creator.name}
              </Anchor>
            ) : (
              <Text variant="subheading1" color="$neutral1" numberOfLines={1}>
                {creator.name}
              </Text>
            )}
            {creator.verified && <CheckmarkCircle size="$icon.16" color="$accent1" />}
          </Flex>
        </ProvenanceCell>

        <ProvenanceCell label={t('tdp.provenance.launchDate')}>
          <Text variant="subheading1" color="$neutral1">
            {launchDate ? localizedDayjs(launchDate).format(FORMAT_DATE_MEDIUM) : '--'}
          </Text>
        </ProvenanceCell>

        <ProvenanceCell label={t('tdp.provenance.launchpad')}>
          <Flex row gap="$spacing8" alignItems="center">
            {/* TODO(CONS-3229): Use the launchpad name and logo from token metadata once available.
                https://linear.app/uniswap/issue/CONS-3229 */}
            <UniswapLogo size="$icon.20" color="$accent1" />
            <Text variant="subheading1" color="$neutral1">
              {UNISWAP_LAUNCHPAD_NAME}
            </Text>
          </Flex>
        </ProvenanceCell>

        {method && (
          <ProvenanceCell label={t('tdp.provenance.launchMethod')}>
            <TouchableArea testID={TestID.TokenDetailsProvenanceLaunchMethod} onPress={() => setIsExplainerOpen(true)}>
              <Flex row gap="$spacing8" alignItems="center">
                <AuctionLaunchMethodIcon method={method} size="$icon.20" />
                <Text variant="subheading1" color="$neutral1">
                  {getAuctionLaunchMethodCopy({ method, t }).label}
                </Text>
              </Flex>
            </TouchableArea>
          </ProvenanceCell>
        )}

        {raised && (
          <ProvenanceCell label={t('tdp.provenance.auctionHistory')}>
            <Flex row gap="$spacing8" alignItems="center">
              <Text variant="subheading1" color="$neutral1">
                {raised.usd !== undefined
                  ? t('tdp.provenance.raised', {
                      amount: convertFiatAmountFormatted(raised.usd, NumberType.FiatTokenStats),
                    })
                  : '--'}
              </Text>
              {raised.detailsHref && (
                <>
                  <Text variant="subheading1" color="$neutral3">
                    ·
                  </Text>
                  <Link to={raised.detailsHref} style={{ textDecoration: 'none' }}>
                    <Text variant="buttonLabel3" color="$accent1">
                      {t('common.details')}
                    </Text>
                  </Link>
                </>
              )}
            </Flex>
          </ProvenanceCell>
        )}
      </Flex>
      {method && (
        <LaunchMethodExplainerModal
          method={method}
          isOpen={isExplainerOpen}
          onClose={() => setIsExplainerOpen(false)}
        />
      )}
    </Flex>
  )
}
