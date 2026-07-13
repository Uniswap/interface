import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo, useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { zeroAddress } from '~/chains'
import {
  FloorPriceSelector,
  type FloorPriceSelectorHandle,
} from '~/pages/Liquidity/CreateAuction/components/FloorPriceSelector'
import { HookTileContainer } from '~/pages/Liquidity/CreateAuction/components/HookTile'
import { type FloorPriceInputState, type InputCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { ExternalLink } from '~/theme/components/Links'

const LOGO_SIZE = iconSizes.icon24

export type PriceSettingsSectionHandle = {
  focusFloorPrice: () => void
}

type PriceSettingsSectionProps = {
  chainId: UniverseChainId
  raiseCurrency: RaiseCurrency
  onSelect: (currency: RaiseCurrency) => void
  floorPrice: string
  floorPriceInput: FloorPriceInputState | undefined
  tokenTotalSupply: CurrencyAmount<Currency>
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  onInputCurrencyChange: (next: InputCurrency) => void
  onFloorPriceChange: (value: string, input?: Omit<FloorPriceInputState, 'floorPrice'>) => void
}

export const PriceSettingsSection = forwardRef<PriceSettingsSectionHandle, PriceSettingsSectionProps>(
  function PriceSettingsSection(
    {
      chainId,
      raiseCurrency,
      onSelect,
      floorPrice,
      floorPriceInput,
      tokenTotalSupply,
      inputCurrency,
      usdPriceNum,
      onInputCurrencyChange,
      onFloorPriceChange,
    },
    ref,
  ) {
    const { t } = useTranslation()
    const floorPriceSelectorRef = useRef<FloorPriceSelectorHandle>(null)

    useImperativeHandle(
      ref,
      () => ({
        focusFloorPrice: () => floorPriceSelectorRef.current?.focus(),
      }),
      [],
    )

    const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)
    const handleSelectEth = useCallback(() => onSelect(RaiseCurrency.ETH), [onSelect])
    const handleSelectUsdc = useCallback(() => onSelect(RaiseCurrency.USDC), [onSelect])
    const usdcCurrencyId = useMemo(() => {
      const usdc = getChainInfo(chainId).tokens.USDC
      return usdc ? buildCurrencyId(chainId, usdc.address) : undefined
    }, [chainId])
    const usdcCurrencyInfo = useCurrencyInfo(usdcCurrencyId, {
      skip: !usdcCurrencyId,
    })

    useEffect(() => {
      if (nativeCurrencyInfo && nativeCurrencyInfo.currency.symbol !== 'ETH') {
        logger.error(
          new Error(
            'PriceSettingsSection: only ETH and USDC are accepted for raising; native currency on this chain is not ETH',
          ),
          {
            tags: {
              file: 'PriceSettingsSection.tsx',
              function: 'PriceSettingsSection',
              chainId,
            },
            extra: {
              nativeCurrencySymbol: nativeCurrencyInfo.currency.symbol,
            },
          },
        )
      }
    }, [chainId, nativeCurrencyInfo])

    return (
      <Flex gap="$spacing12">
        <Flex gap="$spacing4">
          <Text variant="subheading1" color="$neutral1">
            {t('toucan.createAuction.step.configureAuction.priceSettings')}
          </Text>
          <Text variant="body3" color="$neutral2">
            {t('toucan.createAuction.step.configureAuction.priceSettings.description')}
          </Text>
        </Flex>
        <Flex gap="$spacing8">
          <Flex row gap="$spacing8" width="100%">
            <Trace
              logPress
              element={ElementName.AuctionRaiseCurrency}
              properties={{ raise_currency: RaiseCurrency.ETH, raise_currency_address: zeroAddress }}
            >
              <HookTileContainer
                flex={1}
                flexBasis={0}
                minWidth={0}
                onPress={handleSelectEth}
                background={raiseCurrency === RaiseCurrency.ETH ? '$surface3' : '$surface1'}
              >
                <Flex row alignItems="center" gap="$spacing8" position="relative">
                  <Flex width={LOGO_SIZE} height={LOGO_SIZE} flexShrink={0}>
                    {nativeCurrencyInfo ? (
                      <CurrencyLogo hideNetworkLogo currencyInfo={nativeCurrencyInfo} size={LOGO_SIZE} />
                    ) : (
                      <Flex
                        width={LOGO_SIZE}
                        height={LOGO_SIZE}
                        borderRadius="$roundedFull"
                        backgroundColor="$surface3"
                      />
                    )}
                  </Flex>
                  <Text variant="buttonLabel3" color="$neutral1">
                    {nativeCurrencyInfo?.currency.symbol}
                  </Text>
                  {raiseCurrency === RaiseCurrency.ETH && (
                    <Flex position="absolute" top={-4} right={-4}>
                      <CheckCircleFilled size="$icon.20" />
                    </Flex>
                  )}
                </Flex>
                <Text variant="body4" color="$neutral2">
                  {t('toucan.createAuction.step.configureAuction.raiseCurrency.eth.description')}
                </Text>
              </HookTileContainer>
            </Trace>
            <Trace
              logPress
              element={ElementName.AuctionRaiseCurrency}
              properties={{
                raise_currency: RaiseCurrency.USDC,
                raise_currency_address: getChainInfo(chainId).tokens.USDC?.address,
              }}
            >
              <HookTileContainer
                flex={1}
                flexBasis={0}
                minWidth={0}
                onPress={handleSelectUsdc}
                background={raiseCurrency === RaiseCurrency.USDC ? '$surface3' : '$surface1'}
              >
                <Flex row alignItems="center" gap="$spacing8" position="relative">
                  <Flex width={LOGO_SIZE} height={LOGO_SIZE} flexShrink={0}>
                    {usdcCurrencyInfo ? (
                      <CurrencyLogo hideNetworkLogo currencyInfo={usdcCurrencyInfo} size={LOGO_SIZE} />
                    ) : (
                      <Flex
                        width={LOGO_SIZE}
                        height={LOGO_SIZE}
                        borderRadius="$roundedFull"
                        backgroundColor="$surface3"
                      />
                    )}
                  </Flex>
                  <Text variant="buttonLabel3" color="$neutral1">
                    {usdcCurrencyInfo?.currency.symbol}
                  </Text>
                  {raiseCurrency === RaiseCurrency.USDC && (
                    <Flex position="absolute" top={-4} right={-4}>
                      <CheckCircleFilled size="$icon.20" />
                    </Flex>
                  )}
                </Flex>
                <Text variant="body4" color="$neutral2">
                  {t('toucan.createAuction.step.configureAuction.raiseCurrency.usdc.description')}
                </Text>
              </HookTileContainer>
            </Trace>
          </Flex>
          <FloorPriceSelector
            ref={floorPriceSelectorRef}
            key={raiseCurrency}
            chainId={chainId}
            floorPrice={floorPrice}
            floorPriceInput={floorPriceInput}
            raiseCurrency={raiseCurrency}
            tokenTotalSupply={tokenTotalSupply}
            inputCurrency={inputCurrency}
            usdPriceNum={usdPriceNum}
            onInputCurrencyChange={onInputCurrencyChange}
            onFloorPriceChange={onFloorPriceChange}
          />
          <Flex row gap="$spacing4" alignItems="center">
            <QuestionInCircleFilled size="$icon.16" color="$neutral2" />
            <ExternalLink href={UniswapHelpUrls.articles.toucanLaunchAuctionConfigureAuctionHelp}>
              <Text variant="body3" color="$neutral2" textDecorationLine="underline" textDecorationStyle="dashed">
                {t('toucan.createAuction.step.configureAuction.raiseCurrency.helpLink')}
              </Text>
            </ExternalLink>
          </Flex>
        </Flex>
      </Flex>
    )
  },
)
