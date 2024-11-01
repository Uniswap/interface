import { PropsWithChildren } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Separator, Text, UniswapXText, isWeb, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Gas } from 'ui/src/components/icons/Gas'
import { UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FormattedUniswapXGasFeeInfo } from 'uniswap/src/features/gas/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isInterface, isMobileApp } from 'utilities/src/platform'

export function NetworkFeeWarning({
  gasFeeHighRelativeToValue,
  children,
  tooltipTrigger,
  placement = 'top',
  uniswapXGasFeeInfo,
}: PropsWithChildren<{
  gasFeeHighRelativeToValue?: boolean
  tooltipTrigger?: InfoTooltipProps['trigger']
  placement?: InfoTooltipProps['placement']
  uniswapXGasFeeInfo?: FormattedUniswapXGasFeeInfo
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
          <NetworkFeeText showHighGasFeeUI={showHighGasFeeUI} uniswapXGasFeeInfo={uniswapXGasFeeInfo} />
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
        text: <NetworkFeeText showHighGasFeeUI={showHighGasFeeUI} uniswapXGasFeeInfo={uniswapXGasFeeInfo} />,
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
}: {
  showHighGasFeeUI?: boolean
  uniswapXGasFeeInfo?: FormattedUniswapXGasFeeInfo
}): JSX.Element {
  const { t } = useTranslation()

  if (uniswapXGasFeeInfo) {
    return (
      <Text color="$neutral2" textAlign="center" variant={isWeb ? 'body4' : 'body2'}>
        <Trans
          // TODO(WEB-4313): Remove need to manually adjust the height of the UniswapXText component for mobile.
          components={{ gradient: <UniswapXText height={17} variant={isWeb ? 'body4' : 'body2'} /> }}
          i18nKey="swap.warning.networkFee.message.uniswapX"
        />
      </Text>
    )
  }

  return (
    <Text color="$neutral2" textAlign="center" variant={isWeb ? 'body4' : 'body2'}>
      {showHighGasFeeUI ? t('swap.warning.networkFee.highRelativeToValue') : t('swap.warning.networkFee.message')}
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
            {t('swap.warning.networkFee.allow', { inputTokenSymbol })}
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
