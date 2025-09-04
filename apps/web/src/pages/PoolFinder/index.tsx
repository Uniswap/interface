import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { CurrencySelector } from 'components/Liquidity/Create/SelectTokenStep'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { SwitchNetworkAction } from 'components/Popups/types'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { V2Unsupported } from 'components/V2Unsupported'
import { useAccount } from 'hooks/useAccount'
import { useNetworkSupportsV2 } from 'hooks/useNetworkSupportsV2'
import { useTotalSupply } from 'hooks/useTotalSupply'
import { useV2Pair } from 'hooks/useV2Pairs'
import JSBI from 'jsbi'
import ms from 'ms'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useTokenBalance } from 'state/connection/hooks'
import { usePairAdder } from 'state/user/hooks'
import { PositionField } from 'types/position'
import { Button, Flex, Text } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

export default function PoolFinder() {
  const account = useAccount()
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const [success, setSuccess] = useState(false)

  const [currency0, setCurrency0] = useState<Currency | undefined>(() =>
    account.chainId ? nativeOnChain(account.chainId) : undefined,
  )
  const [currency1, setCurrency1] = useState<Currency | undefined>()
  const [currencySearchInputState, setCurrencySearchInputState] = useState<PositionField | undefined>(undefined)

  const [, pair] = useV2Pair(currency0, currency1)
  const addPair = usePairAdder()
  useEffect(() => {
    if (pair) {
      addPair(pair)
    }
  }, [pair, addPair])

  const position: CurrencyAmount<Token> | undefined = useTokenBalance(account.address, pair?.liquidityToken)
  const hasPosition = Boolean(position && JSBI.greaterThan(position.quotient, JSBI.BigInt(0)))

  const userPoolBalance = useTokenBalance(account.address, pair?.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair?.liquidityToken)

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  const token0UsdValue = useUSDCValue(token0Deposited)
  const token1UsdValue = useUSDCValue(token1Deposited)

  const currency0CurrencyInfo = useCurrencyInfo(currencyId(currency0))
  const currency1CurrencyInfo = useCurrencyInfo(currencyId(currency1))

  const networkSupportsV2 = useNetworkSupportsV2()
  if (!networkSupportsV2) {
    return <V2Unsupported />
  }

  return (
    <Trace logImpression page={InterfacePageName.PoolPage}>
      <Flex width="100%" py="$spacing48" px="$spacing40" maxWidth={650}>
        <BreadcrumbNavContainer aria-label="breadcrumb-nav">
          <BreadcrumbNavLink style={{ gap: '8px' }} to="/positions">
            <ArrowLeft size={14} /> <Trans i18nKey="pool.positions.title" />
          </BreadcrumbNavLink>
        </BreadcrumbNavContainer>

        <Text variant="heading2">{t('pool.import.positions.v2')}</Text>

        <Flex mt="$spacing40" borderRadius="$rounded20" borderColor="$surface3" borderWidth="$spacing1" p="$spacing24">
          <Text variant="subheading1">{t('pool.selectPair')}</Text>
          <Text variant="body3" mt="$gap4">
            {t('pool.import.positions.v2.selectPair.description')}
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
                {hasPosition
                  ? t('poolFinder.availablePools.found.description')
                  : t('poolFinder.availablePools.notFound.description')}
              </Text>
            </>
          ) : null}
          {hasPosition && pair && token0UsdValue && token1UsdValue && (
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
                <Text variant="subheading1">
                  {currency0?.symbol}/{currency1?.symbol}
                </Text>
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
                  {convertFiatAmountFormatted(
                    token0UsdValue.add(token1UsdValue).toExact(),
                    NumberType.FiatTokenQuantity,
                  )}
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
                isDisabled={!hasPosition || success}
                onPress={() => {
                  if (hasPosition && pair) {
                    addPair(pair)
                    setSuccess(true)
                    setTimeout(() => {
                      setSuccess(false)
                    }, ms('3s'))
                  }
                }}
              >
                {hasPosition ? (success ? t('pool.import.success') : t('pool.import')) : t('common.button.continue')}
              </Button>
            )}
          </Flex>
        </Flex>

        <CurrencySearchModal
          isOpen={currencySearchInputState !== undefined}
          onDismiss={() => setCurrencySearchInputState(undefined)}
          switchNetworkAction={SwitchNetworkAction.PoolFinder}
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
