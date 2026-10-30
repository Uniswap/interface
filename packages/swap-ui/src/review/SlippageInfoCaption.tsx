import { Flex, Text } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { InfoContainer, SlippageDisplay } from '../types'

function SlippageWarningText({ inTooltip }: { inTooltip: boolean }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered row gap="$spacing8">
      <AlertTriangleFilled color="$statusWarning" size="$icon.16" />
      <Text color="$statusWarning" variant={inTooltip ? 'body4' : 'body2'}>
        {t('swap.settings.slippage.warning.message')}
      </Text>
    </Flex>
  )
}

function SlippageToleranceSummary({ slippage }: { slippage: SlippageDisplay }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
      <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant="body2">
        {t('swap.slippage.settings.title')}
      </Text>

      <Flex row gap="$spacing8">
        {!slippage.isCustom ? (
          <Flex centered backgroundColor="$accent2" borderRadius="$roundedFull" px="$spacing8">
            <Text color="$accent1" variant="buttonLabel3">
              {t('swap.settings.slippage.control.auto')}
            </Text>
          </Flex>
        ) : null}
        <Text color={slippage.exceedsAuto ? '$statusWarning' : '$neutral1'} variant="subheading2">
          {slippage.tolerance}
        </Text>
      </Flex>
    </Flex>
  )
}

export interface SlippageInfoCaptionProps {
  /** The shell this body renders in. Drives layout only (text size, alignment, padding, warning position). */
  container: InfoContainer
  /** Exact-input trade: copy is about the minimum received; otherwise about the maximum spent. */
  isExactInput: boolean
  slippage: SlippageDisplay
  /** `"<amount> <SYMBOL>"`: minimum received (exact-in) or maximum spent (exact-out). */
  slippageAmount: string
  /** Chained trade with custom slippage over more than one step: show the per-step explanation. */
  showChainedMessage: boolean
  /** Steps that carry slippage; feeds the plural `{ count }`. 0 when not chained. */
  chainedStepCount: number
  /** Slot: a "Learn more" link rendered inline after the message. The swap adapter passes it to the tooltip body. */
  learnMoreLink?: ReactNode
  /** Show the settings title, Auto pill and tolerance above the amount. The swap adapter sets it in the mobile app. */
  showToleranceSummary?: boolean
}

export function SlippageInfoCaption({
  container,
  isExactInput,
  slippage,
  slippageAmount,
  showChainedMessage,
  chainedStepCount,
  learnMoreLink,
  showToleranceSummary = false,
}: SlippageInfoCaptionProps): JSX.Element {
  const { t } = useTranslation()
  const inTooltip = container === 'tooltip'
  const warning = slippage.exceedsAuto ? <SlippageWarningText inTooltip={inTooltip} /> : null

  return (
    <Flex gap="$spacing12" width="100%">
      {showChainedMessage && (
        <Text color="$neutral2" textAlign={inTooltip ? 'left' : 'center'} variant={inTooltip ? 'body4' : 'body2'}>
          {t('swap.settings.slippage.chained.message', { count: chainedStepCount })}
        </Text>
      )}
      <Text color="$neutral2" textAlign={inTooltip ? 'left' : 'center'} variant={inTooltip ? 'body4' : 'body2'}>
        {isExactInput ? t('swap.settings.slippage.input.message') : t('swap.settings.slippage.output.message')}{' '}
        {learnMoreLink && <Flex display="inline-flex">{learnMoreLink}</Flex>}
      </Text>

      {inTooltip && warning}

      <Flex
        backgroundColor="$surface2"
        borderRadius={inTooltip ? '$rounded8' : '$rounded20'}
        gap="$spacing8"
        px={inTooltip ? '$spacing8' : '$spacing16'}
        py={inTooltip ? '$spacing8' : '$spacing12'}
        width="100%"
      >
        {showToleranceSummary && <SlippageToleranceSummary slippage={slippage} />}

        <Flex row alignItems="center" gap={inTooltip ? '$spacing8' : '$spacing12'} justifyContent="space-between">
          <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant={inTooltip ? 'body4' : 'body2'}>
            {isExactInput
              ? t('swap.settings.slippage.input.receive.title')
              : t('swap.settings.slippage.output.spend.title')}
          </Text>
          <Text color="$neutral1" textAlign="center" variant={inTooltip ? 'body4' : 'subheading2'}>
            {slippageAmount}
          </Text>
        </Flex>
      </Flex>

      {!inTooltip && warning}
    </Flex>
  )
}
