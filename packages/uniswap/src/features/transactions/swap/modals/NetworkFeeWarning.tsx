import { PropsWithChildren } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Separator, Text, UniswapXText, isWeb, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Gas } from 'ui/src/components/icons/Gas'
import { NATIVE_LINE_HEIGHT_SCALE, fonts } from 'ui/src/theme'
import { UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FormattedUniswapXGasFeeInfo } from 'uniswap/src/features/gas/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isInterface, isMobileApp } from 'utilities/src/platform'

export function NetworkFeeWarning({
  gasFeeHighRelativeToValue,
  children,
  tooltipTrigger,
  placement = 'top',
  uniswapXGasFeeInfo,
  chainId,
}: PropsWithChildren<{
  gasFeeHighRelativeToValue?: boolean
  tooltipTrigger?: InfoTooltipProps['trigger']
  placement?: InfoTooltipProps['placement']
  uniswapXGasFeeInfo?: FormattedUniswapXGasFeeInfo
  chainId: UniverseChainId
}>): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const showHighGasFeeUI = gasFeeHighRelativeToValue && !uniswapXGasFeeInfo && !isInterface // Avoid high gas UI on interface

  return (
    <WarningInfo
      infoButton={
        uniswapXGasFeeInfo ? (
          <UniswapXFeeContent uniswapXGasFeeInfo={uniswapXGasFeeInfo} />
        ) : (
          <LearnMoreLink textVariant={isWeb ? 'body4' : undefined} url={uniswapUrls.helpArticleUrls.networkFeeInfo} />
        )
      }
      modalProps={{
        backgroundIconColor: showHighGasFeeUI ? colors.statusCritical2.get() : colors.surface2.get(),
        captionComponent: (
          <NetworkFeeText
            showHighGasFeeUI={showHighGasFeeUI}
            uniswapXGasFeeInfo={uniswapXGasFeeInfo}
            chainId={chainId}
          />
        ),
        rejectText: t('common.button.close'),
        icon: showHighGasFeeUI ? (
          <AlertTriangleFilled color="$statusCritical" size="$icon.24" />
        ) : (
          <Gas color="$neutral2" size="$icon.24" />
        ),
        modalName: ModalName.NetworkFeeInfo,
        severity: WarningSeverity.None,
        title: showHighGasFeeUI ? t('transaction.networkCost.veryHigh.label') : t('transaction.networkCost.label'),
      }}
      tooltipProps={{
        text: (
          <NetworkFeeText
            showHighGasFeeUI={showHighGasFeeUI}
            uniswapXGasFeeInfo={uniswapXGasFeeInfo}
            chainId={chainId}
          />
        ),
        placement,
        icon: null,
      }}
      trigger={tooltipTrigger}
    >
      {children}
    </WarningInfo>
  )
}

function NetworkFeeText({
  showHighGasFeeUI,
  uniswapXGasFeeInfo,
  chainId,
}: {
  showHighGasFeeUI?: boolean
  uniswapXGasFeeInfo?: FormattedUniswapXGasFeeInfo
  chainId: UniverseChainId
}): JSX.Element {
  const { t } = useTranslation()

  const variant: keyof typeof fonts = isWeb ? 'body4' : 'body2'
  // we need to remove `NATIVE_LINE_HEIGHT_SCALE` if we switch to a button label font
  const lineHeight = fonts[variant].lineHeight / (isWeb ? 1 : NATIVE_LINE_HEIGHT_SCALE)

  if (uniswapXGasFeeInfo) {
    // TODO(WEB-4313): Remove need to manually adjust the height of the UniswapXText component for mobile.
    const components = { gradient: <UniswapXText height={lineHeight} variant={variant} /> }

    return (
      <Text color="$neutral2" textAlign={isWeb ? 'left' : 'center'} variant={variant}>
        {/* TODO(WALL-5311): Investigate Trans component vertical alignment on android */}
        {chainId === UniverseChainId.Unichain ? (
          <Trans components={components} i18nKey="swap.warning.networkFee.message.uniswapX.unichain" />
        ) : (
          <Trans components={components} i18nKey="swap.warning.networkFee.message.uniswapX" />
        )}
      </Text>
    )
  }

  return (
    <Text color="$neutral2" textAlign={isWeb ? 'left' : 'center'} variant={variant}>
      {showHighGasFeeUI
        ? chainId === UniverseChainId.Unichain
          ? t('swap.warning.networkFee.highRelativeToValue.unichain')
          : t('swap.warning.networkFee.highRelativeToValue')
        : chainId === UniverseChainId.Unichain
          ? t('swap.warning.networkFee.message.unichain')
          : t('swap.warning.networkFee.message')}
    </Text>
  )
}

function UniswapXFeeContent({ uniswapXGasFeeInfo }: { uniswapXGasFeeInfo: FormattedUniswapXGasFeeInfo }): JSX.Element {
  const { approvalFeeFormatted, wrapFeeFormatted, swapFeeFormatted, inputTokenSymbol } = uniswapXGasFeeInfo
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing12">
      <Flex row centered={isMobileApp} width="100%">
        <LearnMoreLink textVariant={isWeb ? 'body4' : undefined} url={uniswapUrls.helpArticleUrls.uniswapXInfo} />
      </Flex>
      <Separator />
      {wrapFeeFormatted && (
        <Flex row justifyContent="space-between" width="100%">
          <Text color="$neutral2" variant="body4">
            {t('swap.warning.networkFee.wrap')}
          </Text>
          <Text variant="body4">{wrapFeeFormatted}</Text>
        </Flex>
      )}
      {approvalFeeFormatted && (
        <Flex row justifyContent="space-between" width="100%">
          <Text color="$neutral2" variant="body4">
            {t('swap.warning.networkFee.allow', { inputTokenSymbol: inputTokenSymbol ?? '' })}
          </Text>
          <Text variant="body4">{approvalFeeFormatted}</Text>
        </Flex>
      )}
      <Flex row justifyContent="space-between" width="100%">
        <Text color="$neutral2" variant="body4">
          {t('common.button.swap')}
        </Text>
        <UniswapXFee gasFee={swapFeeFormatted} />
      </Flex>
    </Flex>
  )
}
