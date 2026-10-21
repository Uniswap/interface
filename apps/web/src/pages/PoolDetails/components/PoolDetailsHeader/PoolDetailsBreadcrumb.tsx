import { Flex, Shine } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useTranslation } from 'react-i18next'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from '~/components/BreadcrumbNav'

interface PoolDetailsBreadcrumbProps {
  poolAddress?: string
  token0?: ParsedToken
  token1?: ParsedToken
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
      $md={{ pt: '$none', px: '$none' }}
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
