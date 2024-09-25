import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useCurrencyInfo } from 'hooks/Tokens'
import { AddHook } from 'pages/Pool/Positions/create/AddHook'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { AdvancedButton, Container } from 'pages/Pool/Positions/create/shared'
import { useCallback, useReducer, useState } from 'react'
import { TamaguiClickableStyle } from 'theme/components'
import { PositionField } from 'types/position'
import { Button, Flex, Text, styled } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { Dollar } from 'ui/src/components/icons/Dollar'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { useFormatter } from 'utils/formatNumbers'

const CurrencySelector = ({ currency, onPress }: { currency?: Currency; onPress: () => void }) => {
  const { t } = useTranslation()
  // TODO: remove when backend returns token logos in graphql response: WEB-4920
  const currencyInfo = useCurrencyInfo(currency)

  return (
    <Button
      flex={1}
      width="100%"
      onPress={onPress}
      py="$spacing12"
      pr="$spacing12"
      pl="$spacing16"
      theme="primary"
      backgroundColor={currency ? '$surface3' : '$accent3'}
      justifyContent="space-between"
      gap="$spacing8"
      hoverStyle={{
        backgroundColor: undefined,
        opacity: 0.8,
      }}
      pressStyle={{
        backgroundColor: undefined,
      }}
    >
      <Flex row gap="$spacing8" alignItems="center">
        {currency && (
          <TokenLogo
            size={iconSizes.icon24}
            chainId={currency.chainId}
            name={currency.name}
            symbol={currency.symbol}
            url={currencyInfo?.logoUrl}
          />
        )}
        <Text variant="buttonLabel2" color={currency ? '$neutral1' : '$surface1'}>
          {currency ? currency.symbol : t('fiatOnRamp.button.chooseToken')}
        </Text>
      </Flex>
      <RotatableChevron direction="down" color="$neutral2" width={iconSizes.icon24} height={iconSizes.icon24} />
    </Button>
  )
}

interface FeeTier {
  value: number
  title: string
  selectionPercent: number
}

const FeeTierContainer = styled(Flex, {
  flex: 1,
  width: '100%',
  p: '$spacing12',
  gap: '$spacing8',
  justifyContent: 'space-between',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
  ...TamaguiClickableStyle,
})

const FeeTier = ({
  feeTier,
  selected,
  onSelect,
}: {
  feeTier: FeeTier
  selected: boolean
  onSelect: (value: number) => void
}) => {
  return (
    <FeeTierContainer onPress={() => onSelect(feeTier.value)} background={selected ? '$surface3' : '$surface1'}>
      <Flex row gap={10} justifyContent="space-between" alignItems="center">
        <Text variant="buttonLabel3">{feeTier.value / 10000}%</Text>
        {selected && <CheckCircleFilled size={iconSizes.icon20} />}
      </Flex>
      <Text variant="body4">{feeTier.title}</Text>
      <Text variant="body4" color="$neutral2">
        {feeTier.selectionPercent}% select
      </Text>
    </FeeTierContainer>
  )
}

export function SelectTokensStep({ onContinue }: { onContinue: () => void }) {
  const { formatDelta } = useFormatter()
  const { t } = useTranslation()

  const {
    positionState: {
      tokenInputs: { TOKEN0: token0, TOKEN1: token1 },
      fee,
    },
    setPositionState,
    derivedPositionInfo,
  } = useCreatePositionContext()

  const [currencySearchInputState, setCurrencySearchInputState] = useState<PositionField | undefined>(undefined)
  const [isShowMoreFeeTiersEnabled, toggleShowMoreFeeTiersEnabled] = useReducer((state) => !state, false)
  const continueButtonEnabled = !!derivedPositionInfo.pool

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      switch (currencySearchInputState) {
        case PositionField.TOKEN0:
        case PositionField.TOKEN1:
          setPositionState((prevState) => ({
            ...prevState,
            tokenInputs: { ...prevState.tokenInputs, [currencySearchInputState]: currency },
          }))
          break
        default:
          break
      }
    },
    [currencySearchInputState, setPositionState],
  )

  const handleFeeTierSelect = useCallback(
    (feeTier: number) => {
      setPositionState((prevState) => ({ ...prevState, fee: feeTier }))
    },
    [setPositionState],
  )

  const feeTiers = [
    { value: FeeAmount.LOWEST, title: t(`fee.bestForVeryStable`), selectionPercent: 0 },
    { value: FeeAmount.LOW, title: t(`fee.bestForStablePairs`), selectionPercent: 0 },
    { value: FeeAmount.MEDIUM, title: t(`fee.bestForMost`), selectionPercent: 96 },
    { value: FeeAmount.HIGH, title: t(`fee.bestForExotic`), selectionPercent: 4 },
  ]

  return (
    <>
      <Container>
        <Flex gap="$spacing16">
          <Flex gap="$spacing12">
            <Flex>
              <Text variant="subheading1">
                <Trans i18nKey="pool.selectPair" />
              </Text>
              <Text variant="body3" color="$neutral2">
                <Trans i18nKey="position.provide.liquidity" />
              </Text>
            </Flex>
            <Flex row gap="$gap16">
              <CurrencySelector currency={token0} onPress={() => setCurrencySearchInputState(PositionField.TOKEN0)} />
              <CurrencySelector currency={token1} onPress={() => setCurrencySearchInputState(PositionField.TOKEN1)} />
            </Flex>
            <AddHook />
          </Flex>
        </Flex>
        <Flex gap="$spacing24">
          <Flex>
            <Text variant="subheading1">
              <Trans i18nKey="fee.tier" />
            </Text>
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="fee.tier.description" />
            </Text>
          </Flex>
        </Flex>
        <Flex gap="$spacing8">
          <Flex
            row
            py="$spacing12"
            px="$spacing16"
            gap="$spacing24"
            justifyContent="space-between"
            borderRadius="$rounded12"
            borderWidth={1}
            borderColor="$surface3"
          >
            <Flex>
              <Flex row>
                <Text variant="subheading2" color="$neutral1">
                  <Trans i18nKey="fee.tierExact" values={{ fee: formatDelta(fee / 10_000) }} />
                </Text>
              </Flex>
              <Text variant="body3" color="$neutral2">
                <Trans i18nKey="fee.tier.label" />
              </Text>
            </Flex>
            <Button
              py="$spacing8"
              px="$spacing12"
              gap="$gap4"
              theme="secondary"
              onPress={toggleShowMoreFeeTiersEnabled}
            >
              <Text variant="buttonLabel4">{isShowMoreFeeTiersEnabled ? t('common.less') : t('common.more')}</Text>
              <RotatableChevron
                direction={isShowMoreFeeTiersEnabled ? 'up' : 'down'}
                color="$neutral2"
                width={iconSizes.icon20}
                height={iconSizes.icon20}
              />
            </Button>
          </Flex>
          {isShowMoreFeeTiersEnabled && (
            <Flex row gap={10}>
              {feeTiers.map((feeTier) => (
                <FeeTier
                  key={feeTier.value}
                  feeTier={feeTier}
                  selected={feeTier.value === fee}
                  onSelect={handleFeeTierSelect}
                />
              ))}
            </Flex>
          )}
          <AdvancedButton title={t('fee.tier.search')} Icon={Dollar} onPress={() => {}} />
        </Flex>
        <Button
          flex={1}
          py="$spacing16"
          px="$spacing20"
          backgroundColor="$accent3"
          hoverStyle={{
            backgroundColor: undefined,
            opacity: 0.8,
          }}
          pressStyle={{
            backgroundColor: undefined,
          }}
          onPress={onContinue}
          disabled={!continueButtonEnabled}
        >
          <Text variant="buttonLabel1" color="$surface1">
            <Trans i18nKey="common.button.continue" />
          </Text>
        </Button>
      </Container>

      <CurrencySearchModal
        isOpen={currencySearchInputState !== undefined}
        onDismiss={() => setCurrencySearchInputState(undefined)}
        onCurrencySelect={handleCurrencySelect}
      />
    </>
  )
}
