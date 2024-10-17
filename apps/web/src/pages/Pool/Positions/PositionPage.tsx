import { BigNumber } from '@ethersproject/bignumber'
/* eslint-disable-next-line no-restricted-imports */
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { LiquidityPositionAmountsTile } from 'components/Liquidity/LiquidityPositionAmountsTile'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { LiquidityPositionPriceRangeTile } from 'components/Liquidity/LiquidityPositionPriceRangeTile'
import { PositionNFT } from 'components/Liquidity/PositionNFT'
import { parseRestPosition, parseV3FeeTier, useV3PositionDerivedInfo } from 'components/Liquidity/utils'
import { LoadingFullscreen, LoadingRows } from 'components/Loader/styled'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePositionTokenURI } from 'hooks/usePositionTokenURI'
import { ClaimFeeModal } from 'pages/Pool/Positions/ClaimFeeModal'
import { LoadingRow } from 'pages/Pool/Positions/shared'
import { useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Main, Switch, Text, styled } from 'ui/src'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trans } from 'uniswap/src/i18n'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { useAccount } from 'wagmi'

const BodyWrapper = styled(Main, {
  backgroundColor: '$surface1',
  display: 'flex',
  flexDirection: 'column',
  gap: '$spacing32',
  mx: 'auto',
  width: '100%',
  zIndex: '$default',
  p: '$spacing24',
})

// TODO: replace with Spore button once available
export const HeaderButton = styled(Flex, {
  row: true,
  backgroundColor: '$surface2',
  borderRadius: '$rounded12',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$gap4',
  py: '$padding8',
  px: '$padding12',
  ...ClickableTamaguiStyle,
  variants: {
    emphasis: {
      primary: {
        backgroundColor: '$accent3',
      },
      secondary: {
        backgroundColor: '$surface2',
      },
    },
  } as const,
})

export default function PositionPage() {
  const { tokenId } = useParams<{ tokenId: string }>()
  const account = useAccount()
  const { pathname } = useLocation()
  const { data, isLoading: positionLoading } = useGetPositionQuery(
    account.address
      ? {
          owner: account.address,
          protocolVersion: pathname.includes('v3')
            ? ProtocolVersion.V3
            : pathname.includes('v4')
              ? ProtocolVersion.V4
              : ProtocolVersion.UNSPECIFIED,
          tokenId,
          chainId: account.chainId,
        }
      : undefined,
  )
  const position = data?.position
  const positionInfo = useMemo(() => parseRestPosition(position), [position])
  const metadata = usePositionTokenURI(tokenId ? BigNumber.from(tokenId) : undefined)

  const dispatch = useAppDispatch()
  const [collectAsWeth, setCollectAsWeth] = useState(false)
  const [claimFeeModalOpen, setClaimFeeModalOpen] = useState(false)

  const { value: v4Enabled, isLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Everywhere)
  const { formatCurrencyAmount } = useFormatter()
  const navigate = useNavigate()

  const { currency0Amount, currency1Amount, status } = positionInfo ?? {}
  const {
    feeValue0,
    feeValue1,
    fiatFeeValue0,
    fiatFeeValue1,
    token0CurrentPrice,
    token1CurrentPrice,
    fiatValue0,
    fiatValue1,
    priceOrdering,
  } = useV3PositionDerivedInfo(positionInfo)
  const isTickAtLimit = useIsTickAtLimit(
    parseV3FeeTier(positionInfo?.feeTier),
    Number(positionInfo?.tickLower),
    Number(positionInfo?.tickUpper),
  )

  if (!isLoading && !v4Enabled) {
    return <Navigate to="/pools" replace />
  }

  if (positionLoading || !position || !positionInfo || !currency0Amount || !currency1Amount) {
    return (
      <BodyWrapper>
        <LoadingRows>
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
        </LoadingRows>
      </BodyWrapper>
    )
  }

  return (
    <BodyWrapper>
      <Flex gap="$gap20">
        <Flex row maxWidth={360} justifyContent="flex-start" alignItems="center">
          <BreadcrumbNavContainer aria-label="breadcrumb-nav">
            <BreadcrumbNavLink to="/positions">
              <Trans i18nKey="pool.positions.title" /> <ChevronRight size={14} />
            </BreadcrumbNavLink>
          </BreadcrumbNavContainer>
        </Flex>
        <Flex row justifyContent="space-between" alignItems="center">
          <LiquidityPositionInfo position={position} />
          {status !== PositionStatus.CLOSED && (
            <Flex row gap="$gap12" alignItems="center">
              <HeaderButton
                emphasis="secondary"
                onPress={() => {
                  navigate(`/migrate/v3/${tokenId}`)
                }}
              >
                <Text variant="buttonLabel2" color="$neutral1">
                  <Trans i18nKey="pool.migrateToV4" />
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
          )}
        </Flex>
      </Flex>
      <Flex row width="100%" gap="$gap16">
        <Flex grow backgroundColor="$surface2" borderRadius="$rounded12" justifyContent="center" alignItems="center">
          {'result' in metadata ? (
            <PositionNFT image={metadata.result.image} height={400} />
          ) : (
            <LoadingFullscreen style={{ borderRadius: 12, backgroundColor: 'transparent' }} />
          )}
        </Flex>
        <Flex grow gap="$gap12">
          <Flex borderRadius="$rounded16" backgroundColor="$surface2" p="$padding12" gap="$gap16">
            <Flex gap="$gap8">
              <Text variant="subheading1">
                <Trans i18nKey="common.liquidity" />
              </Text>
              <Text variant="heading2">
                {fiatValue0 && fiatValue1
                  ? formatCurrencyAmount({
                      amount: fiatValue0.add(fiatValue1),
                      type: NumberType.FiatTokenPrice,
                    })
                  : '-'}
              </Text>
            </Flex>
            <LiquidityPositionAmountsTile
              currency0Amount={currency0Amount}
              currency1Amount={currency1Amount}
              fiatValue0={fiatValue0}
              fiatValue1={fiatValue1}
            />
          </Flex>
          <Flex p="$padding12" backgroundColor="$surface2" borderRadius="$rounded16">
            <Flex row width="100%" justifyContent="space-between" alignItems="center">
              <Text variant="subheading1">
                <Trans i18nKey="pool.unclaimedFees" />
              </Text>
              <HeaderButton
                emphasis="primary"
                onPress={() => {
                  setClaimFeeModalOpen(true)
                }}
              >
                <Text variant="buttonLabel4" color="$surface1">
                  <Trans i18nKey="pool.claimFees" />
                </Text>
              </HeaderButton>
            </Flex>
            <Text variant="heading2" mt="$spacing8" mb="$spacing16" color="$statusSuccess">
              {fiatFeeValue0 && fiatFeeValue1
                ? formatCurrencyAmount({
                    amount: fiatFeeValue0.add(fiatFeeValue1),
                    type: NumberType.FiatTokenPrice,
                  })
                : '-'}
            </Text>
            {feeValue0 && feeValue1 && (
              <LiquidityPositionAmountsTile
                currency0Amount={feeValue0}
                currency1Amount={feeValue1}
                fiatValue0={fiatFeeValue0}
                fiatValue1={fiatFeeValue1}
              />
            )}
            <Flex row width="100%" justifyContent="space-between" mt="$spacing16">
              <Text variant="body1">
                <Trans i18nKey="pool.collectAs" values={{ nativeWrappedSymbol: 'WETH' }} />
              </Text>
              <Switch
                variant="default"
                checked={collectAsWeth}
                onCheckedChange={() => {
                  setCollectAsWeth((prev) => !prev)
                }}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      {priceOrdering && token0CurrentPrice && token1CurrentPrice && (
        <LiquidityPositionPriceRangeTile
          status={status}
          priceOrdering={priceOrdering}
          isTickAtLimit={isTickAtLimit}
          token0CurrentPrice={token0CurrentPrice}
          token1CurrentPrice={token1CurrentPrice}
        />
      )}
      <ClaimFeeModal
        positionInfo={positionInfo}
        isOpen={claimFeeModalOpen}
        onClose={() => setClaimFeeModalOpen(false)}
        token0Fees={feeValue0}
        token1Fees={feeValue1}
        token0FeesUsd={fiatFeeValue0}
        token1FeesUsd={fiatFeeValue1}
      />
    </BodyWrapper>
  )
}
