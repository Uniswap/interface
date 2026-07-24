import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo, useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import {
  FloorPriceSelector,
  type FloorPriceSelectorHandle,
} from '~/pages/Liquidity/CreateAuction/components/FloorPriceSelector'
import { HookTileContainer } from '~/pages/Liquidity/CreateAuction/components/HookTile'
import { type FloorPriceInputState, type InputCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { getPrimaryStablecoin, getRaiseCurrencyAddress } from '~/pages/Liquidity/CreateAuction/utils'
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
    const handleSelectNative = useCallback(() => onSelect(RaiseCurrency.NATIVE), [onSelect])
    const handleSelectStablecoin = useCallback(() => onSelect(RaiseCurrency.STABLECOIN), [onSelect])
    const stablecoinCurrencyId = useMemo(
      () => buildCurrencyId(chainId, getPrimaryStablecoin(chainId).address),
      [chainId],
    )
    const stablecoinCurrencyInfo = useCurrencyInfo(stablecoinCurrencyId)

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
              properties={{
                raise_currency: RaiseCurrency.NATIVE,
                raise_currency_address: getRaiseCurrencyAddress(RaiseCurrency.NATIVE, chainId),
              }}
            >
              <HookTileContainer
                flex={1}
                flexBasis={0}
                minWidth={0}
                onPress={handleSelectNative}
                background={raiseCurrency === RaiseCurrency.NATIVE ? '$surface3' : '$surface1'}
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
                  {raiseCurrency === RaiseCurrency.NATIVE && (
                    <Flex position="absolute" top={-4} right={-4}>
                      <CheckCircleFilled size="$icon.20" />
                    </Flex>
                  )}
                </Flex>
                <Text variant="body4" color="$neutral2">
                  {t('toucan.createAuction.step.configureAuction.raiseCurrency.native.description')}
                </Text>
              </HookTileContainer>
            </Trace>
            <Trace
              logPress
              element={ElementName.AuctionRaiseCurrency}
              properties={{
                raise_currency: RaiseCurrency.STABLECOIN,
                raise_currency_address: getRaiseCurrencyAddress(RaiseCurrency.STABLECOIN, chainId),
              }}
            >
              <HookTileContainer
                flex={1}
                flexBasis={0}
                minWidth={0}
                onPress={handleSelectStablecoin}
                background={raiseCurrency === RaiseCurrency.STABLECOIN ? '$surface3' : '$surface1'}
              >
                <Flex row alignItems="center" gap="$spacing8" position="relative">
                  <Flex width={LOGO_SIZE} height={LOGO_SIZE} flexShrink={0}>
                    {stablecoinCurrencyInfo ? (
                      <CurrencyLogo hideNetworkLogo currencyInfo={stablecoinCurrencyInfo} size={LOGO_SIZE} />
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
                    {stablecoinCurrencyInfo?.currency.symbol}
                  </Text>
                  {raiseCurrency === RaiseCurrency.STABLECOIN && (
                    <Flex position="absolute" top={-4} right={-4}>
                      <CheckCircleFilled size="$icon.20" />
                    </Flex>
                  )}
                </Flex>
                <Text variant="body4" color="$neutral2">
                  {t('toucan.createAuction.step.configureAuction.raiseCurrency.stablecoin.description')}
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
