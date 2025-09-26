import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Dot } from 'ui/src/components/icons/Dot'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { VerticalDotLine } from 'ui/src/components/icons/VerticalDotLine'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { TransactionDetailsTooltip as Tooltip } from 'uniswap/src/components/TransactionDetailsTooltip'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isMobileApp } from 'utilities/src/platform'

export function AutoSlippageBadge(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex borderRadius="$rounded6" py="$spacing2" px="$spacing6" backgroundColor="$surface3">
      <Text variant="buttonLabel4" color="$neutral1">
        {t('common.automatic')}
      </Text>
    </Flex>
  )
}

const shieldKeyframe = `
  @keyframes shield-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(150, 70, 250, 0.2);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(150, 70, 250, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(150, 70, 250, 0);
    }
  }
`

const shieldIconKeyframe = `
  @keyframes shield-icon-pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.6;
    }
  }
`

export function MaxSlippageTooltip({
  receivedAmount,
  minimumAmount,
  autoSlippageEnabled,
  currentSlippageTolerance,
}: {
  receivedAmount: string
  minimumAmount: string
  autoSlippageEnabled?: boolean
  currentSlippageTolerance: string
}): JSX.Element | null {
  const { t } = useTranslation()
  const currencies = useSwapFormStoreDerivedSwapInfo((s) => s.currencies)
  const outputCurrencyInfo = currencies[CurrencyField.OUTPUT]

  if (isMobileApp) {
    return null
  }

  return (
    <Tooltip.Outer>
      <Tooltip.Header
        title={{
          title: t('swap.details.slippage.uniswap'),
        }}
        Icon={ShieldCheck}
        iconColor="$uniswapXPurple"
      />
      <Tooltip.Content>
        <Tooltip.Row>
          <Flex row gap="$spacing4">
            <Dot size="$icon.16" color="$neutral1" />
            <Text variant="body4" color="$neutral1">
              {t('swap.expected.price')}
            </Text>
          </Flex>
          <Tooltip.LineItemValue
            value={receivedAmount}
            logo={<CurrencyLogo currencyInfo={outputCurrencyInfo} size={16} />}
          />
        </Tooltip.Row>
        <Flex position="absolute" left={4} top={19}>
          <VerticalDotLine minHeight={12} color="$uniswapXPurple" />
        </Flex>
        <Tooltip.Row>
          <Flex row gap="$spacing4" position="relative">
            <style>{shieldKeyframe}</style>
            <style>{shieldIconKeyframe}</style>
            <Flex width="$spacing16" />
            <Flex
              row
              left={-3}
              top={-3}
              position="absolute"
              alignItems="center"
              justifyContent="center"
              borderWidth="$spacing1"
              borderColor="$surface3"
              borderRadius="$roundedFull"
              p="$spacing4"
              style={{ animation: 'shield-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            >
              <Flex opacity={0.6} style={{ animation: 'shield-icon-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                <ShieldCheck size="$icon.12" color="$uniswapXPurple" />
              </Flex>
            </Flex>
            <Tooltip.LineItemLabel label={t('settings.maxSlippage.amount', { amount: currentSlippageTolerance })} />
            {autoSlippageEnabled && <AutoSlippageBadge />}
          </Flex>
        </Tooltip.Row>
        <Flex position="absolute" left={4} top={50}>
          <VerticalDotLine minHeight={12} color="$uniswapXPurple" />
        </Flex>
        <Tooltip.Row>
          <Flex row gap="$spacing4">
            <Dot size="$icon.16" color="$neutral1" />
            <Tooltip.LineItemLabel label={t('swap.min.price')} />
          </Flex>
          <Tooltip.LineItemValue
            value={minimumAmount}
            logo={<CurrencyLogo currencyInfo={outputCurrencyInfo} size={16} />}
          />
        </Tooltip.Row>
      </Tooltip.Content>
      <Tooltip.Separator />
      <Tooltip.Description
        text={t('swap.slippage.description')}
        learnMoreUrl={uniswapUrls.helpArticleUrls.swapSlippage}
      />
    </Tooltip.Outer>
  )
}
