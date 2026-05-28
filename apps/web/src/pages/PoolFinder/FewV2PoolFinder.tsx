/* eslint-disable import/no-unused-modules */
import { getFewTokenFromOriginalToken } from '@ring-protocol/few-v2-sdk'
import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { V2Unsupported } from 'components/V2Unsupported'
import { useAccount } from 'hooks/useAccount'
import { useFewV2Pair } from 'hooks/useFewV2Pairs'
import { SUPPORTED_V2POOL_CHAIN_IDS, useNetworkSupportsV2 } from 'hooks/useNetworkSupportsV2'
import { useTotalSupply } from 'hooks/useTotalSupply'
import JSBI from 'jsbi'
import ms from 'ms'
import {
  NETWORKS_V2_ONLY,
  NETWORKS_POSITIONS_UNSUPPORTED as POSITIONS_UNSUPPORTED_CHAINS,
} from 'pages/LegacyPool/redirects'
import { CurrencySelector } from 'pages/Pool/Positions/create/SelectTokenStep'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useTokenBalance } from 'state/connection/hooks'
import { useFewPairAdder } from 'state/user/hooks'
import { PositionField } from 'types/position'
import { Button, Flex, Text } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export default function FewV2PoolFinder() {
  const account = useAccount()
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const { formatCurrencyAmount } = useFormatter()
  const [success, setSuccess] = useState(false)

  const [currency0, setCurrency0] = useState<Currency | undefined>(() =>
    account.chainId ? nativeOnChain(account.chainId) : undefined,
  )
  const [currency1, setCurrency1] = useState<Currency | undefined>()
  const [currencySearchInputState, setCurrencySearchInputState] = useState<PositionField | undefined>(undefined)

  const fewToken0 = currency0?.wrapped ? getFewTokenFromOriginalToken(currency0?.wrapped, currency0.chainId) : undefined
  const fewToken1 = currency1?.wrapped ? getFewTokenFromOriginalToken(currency1?.wrapped, currency1.chainId) : undefined

  // Query Fewv2 pair only
  const [, fewPair] = useFewV2Pair(fewToken0, fewToken1)
  const addFewPair = useFewPairAdder()

  // Check Fewv2 position (must be before useEffect so we only cache when user has a position)
  const fewv2Position: CurrencyAmount<Token> | undefined = useTokenBalance(account.address, fewPair?.liquidityToken)
  const hasFewv2Position = Boolean(fewv2Position && JSBI.greaterThan(fewv2Position.quotient, JSBI.BigInt(0)))

  useEffect(() => {
    // Only add to cache when user actually has a position in this pair.
    // Otherwise we would show phantom positions on /positions after searching for non-existent or empty pools.
    if (fewPair && hasFewv2Position) {
      addFewPair(fewPair)
    }
  }, [fewPair, hasFewv2Position, addFewPair])

  const fewv2UserPoolBalance = useTokenBalance(account.address, fewPair?.liquidityToken)
  const fewv2TotalPoolTokens = useTotalSupply(fewPair?.liquidityToken)

  const [fewv2Token0Deposited, fewv2Token1Deposited] =
    !!fewPair &&
    !!fewv2TotalPoolTokens &&
    !!fewv2UserPoolBalance &&
    JSBI.greaterThanOrEqual(fewv2TotalPoolTokens.quotient, fewv2UserPoolBalance.quotient)
      ? [
          fewPair.getLiquidityValue(fewPair.token0, fewv2TotalPoolTokens, fewv2UserPoolBalance, false),
          fewPair.getLiquidityValue(fewPair.token1, fewv2TotalPoolTokens, fewv2UserPoolBalance, false),
        ]
      : [undefined, undefined]

  const fewv2Token0UsdValue = useUSDCValue(fewv2Token0Deposited)
  const fewv2Token1UsdValue = useUSDCValue(fewv2Token1Deposited)

  const currency0CurrencyInfo = useCurrencyInfo(currencyId(currency0))
  const currency1CurrencyInfo = useCurrencyInfo(currencyId(currency1))

  const networkSupportsV2 = useNetworkSupportsV2()
  const { chains: enabledChains } = useEnabledChains()
  const enabledSet = new Set(enabledChains)

  if (!networkSupportsV2) {
    return <V2Unsupported />
  }

  const fewv2NetworkLabels = SUPPORTED_V2POOL_CHAIN_IDS.filter(
    (id) =>
      !NETWORKS_V2_ONLY.includes(id as UniverseChainId) &&
      !POSITIONS_UNSUPPORTED_CHAINS.includes(id as UniverseChainId) &&
      getChainInfo(id as UniverseChainId) &&
      enabledSet.has(id as UniverseChainId),
  ).map((id) => getChainLabel(id as UniverseChainId))

  return (
    <Trace logImpression page={InterfacePageName.POOL_PAGE}>
      <Flex width="100%" py="$spacing48" px="$spacing40" maxWidth={650}>
        <BreadcrumbNavContainer aria-label="breadcrumb-nav">
          <BreadcrumbNavLink style={{ gap: '8px' }} to="/positions">
            <ArrowLeft size={14} /> <Trans i18nKey="pool.positions.title" />
          </BreadcrumbNavLink>
        </BreadcrumbNavContainer>

        <Text variant="heading2">{t('pool.import.positions.fewv2')}</Text>
        <Text variant="body3" color="$neutral2" mt="$gap8">
          {t('pool.import.findPage.fewv2.networks', {
            networks: fewv2NetworkLabels.join(', '),
          })}
        </Text>

        <Flex mt="$spacing40" borderRadius="$rounded20" borderColor="$surface3" borderWidth="$spacing1" p="$spacing24">
          <Text variant="subheading1">{t('pool.selectPair')}</Text>
          <Text variant="body3" mt="$gap4">
            {t('pool.import.positions.fewv2.selectPair.description')}
          </Text>
          <Flex row gap="$gap16" $md={{ flexDirection: 'column' }} mt="$spacing12">
            <CurrencySelector
              currencyInfo={currency0CurrencyInfo}
              onPress={() => setCurrencySearchInputState(PositionField.TOKEN0)}
            />
            <CurrencySelector
              currencyInfo={currency1CurrencyInfo}
              onPress={() => setCurrencySearchInputState(PositionField.TOKEN1)}
            />
          </Flex>
          {currency0 && currency1 && account.isConnected ? (
            <>
              <Text variant="subheading1" mt="$gap32">
                {t('poolFinder.availablePools')}
              </Text>
              <Text variant="body3" mt="$gap4">
                {hasFewv2Position
                  ? t('poolFinder.availablePools.found.description')
                  : t('poolFinder.availablePools.notFound.description')}
              </Text>
              {/* Debug: Print pool information */}
              {/* {(() => {
                console.log('=== FewV2 Pool Finder Debug ===')
                console.log('Currency0:', {
                  symbol: currency0?.symbol,
                  address: currency0?.wrapped?.address,
                  chainId: currency0?.chainId,
                })
                console.log('Currency1:', {
                  symbol: currency1?.symbol,
                  address: currency1?.wrapped?.address,
                  chainId: currency1?.chainId,
                })
                console.log('FewToken0:', fewToken0 ? {
                  address: fewToken0.address,
                  symbol: fewToken0.symbol,
                  chainId: fewToken0.chainId,
                } : null)
                console.log('FewToken1:', fewToken1 ? {
                  address: fewToken1.address,
                  symbol: fewToken1.symbol,
                  chainId: fewToken1.chainId,
                } : null)
                console.log('FewPair:', fewPair ? {
                  token0: fewPair.token0.address,
                  token1: fewPair.token1.address,
                  liquidityToken: fewPair.liquidityToken.address,
                  reserve0: fewPair.reserve0.toExact(),
                  reserve1: fewPair.reserve1.toExact(),
                } : null)
                console.log('Has FewV2 Position:', hasFewv2Position)
                console.log('FewV2 Position Balance:', fewv2Position?.toExact())
                console.log('================================')
                return null
              })()} */}
            </>
          ) : null}
          {/* Fewv2 Position Display */}
          {hasFewv2Position && fewPair && fewv2Token0UsdValue && fewv2Token1UsdValue && (
            <Flex
              mt="$gap12"
              width="100%"
              row
              alignItems="center"
              justifyContent="space-between"
              p="$padding16"
              borderRadius="$rounded16"
              borderWidth="$spacing1"
              borderColor="$surface3"
              $md={{ row: false, gap: '$gap16', alignItems: 'flex-start' }}
            >
              <Flex row alignItems="center" gap="$gap16" $md={{ justifyContent: 'space-between' }}>
                <DoubleCurrencyLogo currencies={[currency0, currency1]} size={40} />
                <Flex gap="$gap4">
                  <Text variant="subheading1">
                    {currency0?.symbol}/{currency1?.symbol}
                  </Text>
                  <Text variant="body3" color="$neutral2">
                    Fewv2
                  </Text>
                </Flex>
              </Flex>
              <Flex
                $md={{
                  row: true,
                  gap: '$gap8',
                  alignItems: 'center',
                  flexDirection: 'row-reverse',
                  justifyContent: 'space-between',
                }}
              >
                <Text variant="body2" textAlign="right">
                  {formatCurrencyAmount({
                    amount: fewv2Token0UsdValue.add(fewv2Token1UsdValue),
                    type: NumberType.FiatTokenQuantity,
                  })}
                </Text>
                <Text variant="body3" color="$neutral2">
                  {t('position.value')}
                </Text>
              </Flex>
            </Flex>
          )}
          <Flex row>
            {!account.isConnected ? (
              <Button size="large" emphasis="secondary" mt="$gap32" onPress={accountDrawer.open}>
                {t('common.connectWallet.button')}
              </Button>
            ) : (
              <Button
                size="large"
                emphasis="secondary"
                mt="$gap32"
                isDisabled={!hasFewv2Position || success}
                onPress={() => {
                  // Import Fewv2 pair
                  if (hasFewv2Position && fewPair) {
                    addFewPair(fewPair)
                    setSuccess(true)
                    setTimeout(() => {
                      setSuccess(false)
                    }, ms('3s'))
                  }
                }}
              >
                {hasFewv2Position
                  ? success
                    ? t('pool.import.success')
                    : t('pool.import')
                  : t('common.button.continue')}
              </Button>
            )}
          </Flex>
        </Flex>

        <CurrencySearchModal
          isOpen={currencySearchInputState !== undefined}
          onDismiss={() => setCurrencySearchInputState(undefined)}
          onCurrencySelect={(currency) => {
            if (currencySearchInputState === PositionField.TOKEN0) {
              setCurrency0(currency)
            } else if (currencySearchInputState === PositionField.TOKEN1) {
              setCurrency1(currency)
            }
            setCurrencySearchInputState(undefined)
          }}
        />
      </Flex>
    </Trace>
  )
}
