import { Price } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { LiquidityPositionAmountsTile } from 'components/Liquidity/LiquidityPositionAmountsTile'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { LiquidityPositionPriceRangeTile } from 'components/Liquidity/LiquidityPositionPriceRangeTile'
import { PositionNFT } from 'components/Liquidity/PositionNFT'
import { usePositionInfo } from 'components/Liquidity/utils'
import { LoadingFullscreen } from 'components/Loader/styled'
import { usePositionTokenURI } from 'hooks/usePositionTokenURI'
import { useState } from 'react'
import { ChevronRight } from 'react-feather'
import { Navigate, useParams } from 'react-router-dom'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Main, Switch, Text, styled } from 'ui/src'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trans } from 'uniswap/src/i18n'

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
  const { positionId } = useParams<{ positionId: string }>()
  // const { t } = useTranslation()
  // TODO(WEB-4920): replace this with real query fetching the position by ID
  const { data } = useGetPositionsQuery()
  const position = data?.positions[1]
  const positionInfo = usePositionInfo(position)
  const metadata = usePositionTokenURI(positionId ? parseInt(positionId) : undefined)

  const dispatch = useAppDispatch()
  const [collectAsWeth, setCollectAsWeth] = useState(false)

  const { value: v4Enabled, isLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Everywhere)

  if (!isLoading && !v4Enabled) {
    return <Navigate to="/pools" replace />
  }

  if (!position || !positionInfo) {
    // TODO(WEB-4920): handle loading/error states
    return null
  }

  const { currency0Amount, currency1Amount, status } = positionInfo

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
          <Flex row gap="$gap12" alignItems="center">
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
        </Flex>
      </Flex>
      <Flex row width="100%" gap="$gap16">
        <Flex grow backgroundColor="$surface2" borderRadius="$rounded12">
          {'result' in metadata ? (
            <PositionNFT image={metadata.result.image} height={500} />
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
              {/* TODO(WEB-4920): get est. USD value of position */}
              <Text variant="heading2">$5678.90</Text>
            </Flex>
            <LiquidityPositionAmountsTile currency0Amount={currency0Amount} currency1Amount={currency1Amount} />
          </Flex>
          <Flex p="$padding12" backgroundColor="$surface2" borderRadius="$rounded16">
            <Flex row width="100%" justifyContent="space-between" alignItems="center">
              <Text variant="subheading1">
                <Trans i18nKey="pool.unclaimedFees" />
              </Text>
              <HeaderButton
                emphasis="primary"
                onPress={() => {
                  // TODO(WEB-4920): open claim fees modal
                }}
              >
                <Text variant="buttonLabel4" color="$surface1">
                  <Trans i18nKey="pool.claimFees" />
                </Text>
              </HeaderButton>
            </Flex>
            <Text variant="heading2" mt="$spacing8" mb="$spacing16" color="$statusSuccess">
              $1,084.61
            </Text>
            <LiquidityPositionAmountsTile currency0Amount={currency0Amount} currency1Amount={currency1Amount} />
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
      <LiquidityPositionPriceRangeTile
        status={status}
        // TODO(WEB-4920): replace with real prices
        minPrice={
          new Price({
            baseAmount: currency0Amount,
            quoteAmount: currency1Amount,
          })
        }
        maxPrice={
          new Price({
            baseAmount: currency0Amount,
            quoteAmount: currency1Amount,
          })
        }
        currentPrice={
          new Price({
            baseAmount: currency0Amount,
            quoteAmount: currency1Amount,
          })
        }
      />
    </BodyWrapper>
  )
}
