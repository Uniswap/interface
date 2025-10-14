import { ProgressBar } from 'components/Toucan/Auction/ProgressBar'
import { useAuctionStore } from 'components/Toucan/Auction/store/useAuctionStore'
import { useBlockTimestamp } from 'hooks/useBlockTimestamp'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  ColorTokens,
  Flex,
  getContrastPassingTextColor,
  Text,
  TouchableArea,
  useColorsFromTokenColor,
} from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { CurrencyField } from 'uniswap/src/types/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { getDurationRemainingString } from 'utilities/src/time/duration'

function BidForm({
  tokenColor,
  durationRemaining,
  onBack,
}: {
  tokenColor?: ColorTokens
  durationRemaining?: string
  onBack: () => void
}) {
  const { t } = useTranslation()
  const { chainId, bidTokenAddress } = useAuctionStore((state) => ({
    chainId: state.auctionDetails?.chainId,
    bidTokenAddress: state.auctionDetails?.bidTokenAddress,
  }))

  const accountAddress = useActiveAddress(chainId ?? UniverseChainId.Mainnet)

  const bidCurrencyInfo = useCurrencyInfo(buildCurrencyId(chainId ?? UniverseChainId.Mainnet, bidTokenAddress ?? ''))
  const [exactAmount, setExactAmount] = useState('')
  const [isFiatMode, setIsFiatMode] = useState(false)

  const currencyBalance = useCurrencyBalance(accountAddress, bidCurrencyInfo?.currency)
  const currencyAmount = tryParseCurrencyAmount(exactAmount, bidCurrencyInfo?.currency)
  const usdValue = useUSDCValue(currencyAmount)

  const onToggleIsFiatMode = useEvent(() => {
    setIsFiatMode((prev) => !prev)
  })

  const onSetPresetValue = useEvent((amount: string) => {
    // When preset is selected, switch to token mode and set the amount
    setIsFiatMode(false)
    setExactAmount(amount)
  })

  return (
    <>
      <Flex row gap="$spacing12" alignItems="center" mb="$spacing16">
        <TouchableArea onPress={onBack}>
          <Arrow direction="w" size={iconSizes.icon20} />
        </TouchableArea>
        <Text>{t('toucan.bidForm.placeBid')}</Text>
        <Flex marginLeft="auto" row alignItems="center" gap="$spacing6">
          {/* TODO: make this pulsing */}
          <Flex backgroundColor={tokenColor} width={8} height={8} borderRadius="$roundedFull" />
          <Text variant="body4" color="$neutral2">
            {durationRemaining}
          </Text>
        </Flex>
      </Flex>
      <Flex gap="$spacing12">
        <CurrencyInputPanel
          autoFocus={true}
          currencyAmount={currencyAmount}
          currencyBalance={currencyBalance}
          currencyInfo={bidCurrencyInfo}
          currencyField={CurrencyField.INPUT}
          headerLabel={t('toucan.bidForm.maxBudget')}
          value={exactAmount}
          usdValue={usdValue}
          onSetExactAmount={setExactAmount}
          onSetPresetValue={onSetPresetValue}
          onToggleIsFiatMode={onToggleIsFiatMode}
          isFiatMode={isFiatMode}
          customPanelStyle={{
            backgroundColor: '$surface2',
            borderRadius: '$rounded20',
          }}
        />
      </Flex>
    </>
  )
}

export function BidFormSection() {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const { auctionDetails, tokenColor, checkpointData } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    tokenColor: state.tokenColor,
    checkpointData: state.checkpointData,
  }))

  const { validTokenColor } = useColorsFromTokenColor(tokenColor)

  const [showForm, setShowForm] = useState(false)

  // Get the timestamp for the auction end block
  const endBlockTimestamp = useBlockTimestamp({
    chainId: auctionDetails?.chainId as EVMUniverseChainId,
    blockNumber: auctionDetails?.endBlock,
  })
  // Calculate duration remaining based on the end block timestamp
  const durationRemaining = endBlockTimestamp ? getDurationRemainingString(Number(endBlockTimestamp) * 1000) : undefined

  return (
    <Flex maxWidth={400} width="36%">
      {!showForm && (
        <>
          <Flex grow>
            <Text variant="heading3">{auctionDetails?.tokenSymbol} is short for the newest type of Toucan</Text>
            <Flex my="$spacing16" gap="$gap12">
              <Flex row justifyContent="space-between">
                <Text variant="body4" color="$neutral2">
                  {formatPercent((checkpointData?.cumulativeMps ?? 0) * 100)} sold
                </Text>
                <Text variant="body4">Ends in {durationRemaining}</Text>
              </Flex>
              <ProgressBar
                percentage={checkpointData?.cumulativeMps ?? 0}
                graduationThreshold={auctionDetails?.graduationThreshold ?? 0}
                color={validTokenColor}
              />
            </Flex>
            <Text variant="body2" color="$neutral2">
              Toucans are known for their extraordinarily large and colorful beaks, which can make up one-third of their
              total body length. Despite their impressive size, toucan beaks are surprisingly lightweight and help
              regulate their body temperature.
            </Text>
            <Text variant="buttonLabel3" color={tokenColor}>
              Learn more about Toucans
            </Text>
          </Flex>

          <Button fill={false} backgroundColor={validTokenColor} onPress={() => setShowForm(true)}>
            <Button.Text color={tokenColor ? getContrastPassingTextColor(tokenColor) : '$white'}>
              {t('common.getStarted')}
            </Button.Text>
          </Button>
        </>
      )}

      {showForm && (
        <BidForm tokenColor={validTokenColor} durationRemaining={durationRemaining} onBack={() => setShowForm(false)} />
      )}
    </Flex>
  )
}
