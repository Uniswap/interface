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
  useSporeColors,
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

function useDurationRemaining(chainId: EVMUniverseChainId, endBlock: number | undefined) {
  const endBlockTimestamp = useBlockTimestamp({
    chainId,
    blockNumber: endBlock,
    watch: true, // Enable watching for block updates to keep duration updated
  })
  // Calculate duration remaining based on the end block timestamp
  return endBlockTimestamp ? getDurationRemainingString(Number(endBlockTimestamp) * 1000) : undefined
}

function BidForm({ tokenColor, onBack }: { tokenColor?: ColorTokens; onBack: () => void }) {
  const { t } = useTranslation()
  const { chainId, bidTokenAddress, endBlock } = useAuctionStore((state) => ({
    chainId: state.auctionDetails?.chainId,
    bidTokenAddress: state.auctionDetails?.bidTokenAddress,
    endBlock: state.auctionDetails?.endBlock,
  }))

  const colors = useSporeColors()
  const glowColor = tokenColor || colors.surface1.val

  const pulseKeyframe = `
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 ${glowColor}40;
      }
      50% {
        box-shadow: 0 0 0 4px ${glowColor}40;
      }
      100% {
        box-shadow: 0 0 0 4px ${glowColor}00;
      }
    }
  `

  const accountAddress = useActiveAddress(chainId ?? UniverseChainId.Mainnet)

  const durationRemaining = useDurationRemaining(chainId as EVMUniverseChainId, endBlock)
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
      <style>{pulseKeyframe}</style>
      <Flex row gap="$spacing12" alignItems="center" mb="$spacing16">
        <TouchableArea onPress={onBack}>
          <Arrow direction="w" size={iconSizes.icon20} />
        </TouchableArea>
        <Text>{t('toucan.bidForm.placeBid')}</Text>
        <Flex marginLeft="auto" row alignItems="center" gap="$spacing6">
          <Flex
            backgroundColor={tokenColor}
            width={8}
            height={8}
            borderRadius="$roundedFull"
            style={{
              animation: 'pulse 1.5s infinite',
            }}
          />
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

  // Calculate duration remaining based on the end block timestamp
  const durationRemaining = useDurationRemaining(
    auctionDetails?.chainId as EVMUniverseChainId,
    auctionDetails?.endBlock,
  )

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

      {showForm && <BidForm tokenColor={validTokenColor} onBack={() => setShowForm(false)} />}
    </Flex>
  )
}
