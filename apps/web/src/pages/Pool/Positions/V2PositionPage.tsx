import { Percent } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { usePositionInfo } from 'components/Liquidity/utils'
import { DoubleCurrencyAndChainLogo } from 'components/Logo/DoubleLogo'
import { useTotalSupply } from 'hooks/useTotalSupply'
import JSBI from 'jsbi'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { HeaderButton } from 'pages/Pool/Positions/PositionPage'
import { ChevronRight } from 'react-feather'
import { Navigate, useNavigate } from 'react-router-dom'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { Flex, Main, Text, styled } from 'ui/src'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trans } from 'uniswap/src/i18n'
import { useFormatter } from 'utils/formatNumbers'
import { useAccount } from 'wagmi'

const BodyWrapper = styled(Main, {
  backgroundColor: '$surface1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  mx: 'auto',
  width: '100%',
  zIndex: '$default',
  p: '$spacing24',
})

export default function V2PositionPage() {
  // const { currencyIdA, currencyIdB } = useParams<{ positionId: string }>()
  // TODO(WEB-4920): replace this with real query fetching the position by the params above
  const { data } = useGetPositionsQuery()
  const position = data?.positions[0]
  const positionInfo = usePositionInfo(position)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const account = useAccount()
  const { formatPercent } = useFormatter()

  const userDefaultPoolBalance = useTokenBalance(account.address, positionInfo?.liquidityToken)
  const totalPoolTokens = useTotalSupply(positionInfo?.liquidityToken)

  const poolTokenPercentage =
    !!userDefaultPoolBalance &&
    !!totalPoolTokens &&
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userDefaultPoolBalance.quotient)
      ? new Percent(userDefaultPoolBalance.quotient, totalPoolTokens.quotient)
      : undefined

  const { value: v4Enabled, isLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Everywhere)

  if (!isLoading && !v4Enabled) {
    return <Navigate to="/pools" replace />
  }

  if (!position || !positionInfo) {
    // TODO(WEB-4920): handle loading/error states
    return null
  }

  const { currency0Amount, currency1Amount } = positionInfo

  return (
    <BodyWrapper>
      <Flex gap="$gap20" width={580}>
        <Flex row width="100%" justifyContent="flex-start" alignItems="center">
          <BreadcrumbNavContainer aria-label="breadcrumb-nav">
            <BreadcrumbNavLink to="/positions">
              <Trans i18nKey="pool.positions.title" /> <ChevronRight size={14} />
            </BreadcrumbNavLink>
          </BreadcrumbNavContainer>
        </Flex>

        <LiquidityPositionInfo position={position} />
        <Flex row gap="$gap12" alignItems="center">
          <HeaderButton
            emphasis="secondary"
            onPress={() => {
              navigate('/migrate/v2')
            }}
          >
            <Text variant="buttonLabel2" color="$neutral1">
              <Trans i18nKey="common.migrate" />
            </Text>
          </HeaderButton>
          <HeaderButton
            emphasis="secondary"
            onPress={() => {
              dispatch(setOpenModal({ name: ModalName.AddLiquidity, initialState: position }))
            }}
          >
            <Text variant="buttonLabel2" color="$neutral1">
              <Trans i18nKey="common.addLiquidity" />
            </Text>
          </HeaderButton>
          <HeaderButton
            emphasis="primary"
            onPress={() => {
              dispatch(setOpenModal({ name: ModalName.RemoveLiquidity, initialState: position }))
            }}
          >
            <Text variant="buttonLabel2" color="$surface1">
              <Trans i18nKey="pool.removeLiquidity" />
            </Text>
          </HeaderButton>
        </Flex>
        <Flex borderColor="$surface3" borderWidth={1} p="$spacing24" gap="$gap12" borderRadius="$rounded20">
          <Flex row width="100%" justifyContent="space-between">
            <Text variant="subheading2" color="$neutral2">
              <Trans i18nKey="position.currentValue" />
            </Text>
            {/* TODO(WEB-4920): get real USD position value */}
            <Text variant="body2">$1482.21</Text>
          </Flex>
          <Flex row width="100%" justifyContent="space-between">
            <Text variant="subheading2" color="$neutral2">
              <Trans i18nKey="pool.totalTokens" />
            </Text>
            <Flex row gap="$gap8">
              <Text variant="body2">{userDefaultPoolBalance ? userDefaultPoolBalance.toSignificant(4) : '-'}</Text>
              <DoubleCurrencyAndChainLogo
                chainId={currency0Amount?.currency.chainId}
                currencies={[currency0Amount?.currency, currency1Amount?.currency]}
                size={24}
              />
            </Flex>
          </Flex>
          <Flex row width="100%" justifyContent="space-between">
            <Text variant="subheading2" color="$neutral2">
              <Trans
                i18nKey="position.depositedCurrency"
                values={{ currencySymbol: currency0Amount.currency.symbol }}
              />
            </Text>
            <Flex row gap="$gap8">
              <Text variant="body2">{currency0Amount.toSignificant(4)}</Text>
              <DoubleCurrencyAndChainLogo
                chainId={currency0Amount?.currency.chainId}
                currencies={[currency0Amount?.currency]}
                size={24}
              />
            </Flex>
          </Flex>
          <Flex row width="100%" justifyContent="space-between">
            <Text variant="subheading2" color="$neutral2">
              <Trans
                i18nKey="position.depositedCurrency"
                values={{ currencySymbol: currency1Amount.currency.symbol }}
              />
            </Text>
            <Flex row gap="$gap8">
              <Text variant="body2">{currency1Amount.toSignificant(4)}</Text>
              <DoubleCurrencyAndChainLogo
                chainId={currency1Amount?.currency.chainId}
                currencies={[currency1Amount?.currency]}
                size={24}
              />
            </Flex>
          </Flex>
          <Flex row width="100%" justifyContent="space-between">
            <Text variant="subheading2" color="$neutral2">
              <Trans i18nKey="addLiquidity.shareOfPool" />
            </Text>
            <Text variant="body2">{formatPercent(poolTokenPercentage)}</Text>
          </Flex>
        </Flex>
      </Flex>
    </BodyWrapper>
  )
}
