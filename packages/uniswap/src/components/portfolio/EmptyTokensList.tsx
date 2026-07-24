import { isMobileApp } from '@universe/environment'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, Loader } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { useTokenBalanceListContext } from 'uniswap/src/features/portfolio/TokenBalanceListContext'

export const EmptyTokensList = memo(function EmptyTokensListInner({
  emptyCondition,
  emptyTokensComponent,
  errorCardContainerStyle,
}: {
  emptyCondition: boolean
  emptyTokensComponent?: JSX.Element | null
  errorCardContainerStyle: FlexProps
}): JSX.Element | null {
  const { t } = useTranslation()
  const { balancesById, isPending, refetch, error } = useTokenBalanceListContext()

  const isLoadingWithoutCachedValues = !balancesById && isPending
  const hasErrorWithoutCachedValues = error !== undefined && !balancesById

  if (isLoadingWithoutCachedValues) {
    return (
      <Flex px={isMobileApp ? '$spacing24' : undefined}>
        <Loader.Token withPrice repeat={6} />
      </Flex>
    )
  }

  if (hasErrorWithoutCachedValues) {
    return (
      <Flex {...errorCardContainerStyle}>
        <BaseCard.ErrorState
          retryButtonLabel={t('common.button.retry')}
          title={t('home.tokens.error.load')}
          onRetry={(): void | undefined => refetch?.()}
        />
      </Flex>
    )
  }

  if (emptyCondition) {
    return emptyTokensComponent ?? null
  }

  return null
})
