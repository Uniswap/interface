import { GraphQLApi } from '@universe/api'
import { useTranslation } from 'react-i18next'
import { Flex, Shine } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from '~/components/BreadcrumbNav'

interface PoolDetailsBreadcrumbProps {
  poolAddress?: string
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  loading?: boolean
}

export function PoolDetailsBreadcrumb({ poolAddress, token0, token1, loading }: PoolDetailsBreadcrumbProps) {
  const { t } = useTranslation()

  return (
    <BreadcrumbNavContainer
      aria-label="breadcrumb-nav"
      width="100%"
      px="$spacing40"
      pt="$spacing48"
      mb="$spacing8"
      $lg={{ px: '$padding20' }}
    >
      <BreadcrumbNavLink to="/explore/pools">
        {t('common.pools')} <RotatableChevron direction="right" size="$icon.16" />
      </BreadcrumbNavLink>
      {loading || !poolAddress ? (
        <Shine>
          <Flex width={80} height={20} borderRadius={20} backgroundColor="$surface3" />
        </Shine>
      ) : (
        <CurrentPageBreadcrumb poolName={`${token0?.symbol} / ${token1?.symbol}`} />
      )}
    </BreadcrumbNavContainer>
  )
}
