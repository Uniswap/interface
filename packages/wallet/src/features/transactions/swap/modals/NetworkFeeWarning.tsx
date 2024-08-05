import { PropsWithChildren } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Separator, Text, UniswapXText, isWeb, useSporeColors } from 'ui/src'
import { Gas } from 'ui/src/components/icons'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isMobile } from 'utilities/src/platform'
import { WarningInfo } from 'wallet/src/components/modals/WarningModal/WarningInfo'
import { WarningTooltipProps } from 'wallet/src/components/modals/WarningModal/WarningTooltipProps'
import { UniswapXFee } from 'wallet/src/components/network/NetworkFee'
import { FormattedUniswapXGasFeeInfo } from 'wallet/src/components/network/hooks'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'

export function NetworkFeeWarning({
  gasFeeHighRelativeToValue,
  children,
  tooltipTrigger,
  placement = 'top',
  uniswapXGasFeeInfo,
}: PropsWithChildren<{
  gasFeeHighRelativeToValue?: boolean
  tooltipTrigger?: WarningTooltipProps['trigger']
  placement?: WarningTooltipProps['placement']
  uniswapXGasFeeInfo?: FormattedUniswapXGasFeeInfo
}>): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const showHighGasFeeUI = gasFeeHighRelativeToValue && !uniswapXGasFeeInfo

  return (
    <WarningInfo
      infoButton={
        uniswapXGasFeeInfo ? (
          <UniswapXFeeContent uniswapXGasFeeInfo={uniswapXGasFeeInfo} />
        ) : (
          <LearnMoreLink
            textVariant={isWeb ? 'buttonLabel4' : undefined}
            url={uniswapUrls.helpArticleUrls.networkFeeInfo}
          />
        )
      }
      modalProps={{
        backgroundIconColor: colors.surface2.get(),
        caption: <NetworkFeeText showHighGasFeeUI={showHighGasFeeUI} uniswapXGasFeeInfo={uniswapXGasFeeInfo} />,
        closeText: t('common.button.close'),
        icon: <Gas color={showHighGasFeeUI ? '$statusCritical' : '$neutral2'} size="$icon.24" />,
        modalName: ModalName.NetworkFeeInfo,
        severity: WarningSeverity.None,
        title: t('transaction.networkCost.label'),
      }}
      tooltipProps={{
        text: <NetworkFeeText showHighGasFeeUI={showHighGasFeeUI} uniswapXGasFeeInfo={uniswapXGasFeeInfo} />,
        placement,
        icon: showHighGasFeeUI ? <Gas color="$statusCritical" size="$icon.16" /> : null,
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
      <Trans
        components={{ gradient: <UniswapXText height={18} variant="body3" /> }}
        i18nKey="swap.warning.networkFee.message.uniswapX"
      />
    )
  } else if (showHighGasFeeUI) {
    return t('swap.warning.networkFee.highRelativeToValue')
  } else {
    return t('swap.warning.networkFee.message')
  }
}

function UniswapXFeeContent({ uniswapXGasFeeInfo }: { uniswapXGasFeeInfo: FormattedUniswapXGasFeeInfo }): JSX.Element {
  const { approvalFeeFormatted, wrapFeeFormatted, swapFeeFormatted, inputTokenSymbol } = uniswapXGasFeeInfo
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing12">
      <Flex centered={isMobile} width="100%">
        <LearnMoreLink
          textVariant={isWeb ? 'buttonLabel4' : undefined}
          url={uniswapUrls.helpArticleUrls.uniswapXInfo}
        />
      </Flex>
      <Separator />
      {wrapFeeFormatted && (
        <Flex row justifyContent="space-between" width="100%">
          <Text color="$neutral2" variant="body3">
            {t('swap.warning.networkFee.wrap')}
          </Text>
          <Text variant="body3">{wrapFeeFormatted}</Text>
        </Flex>
      )}
      {approvalFeeFormatted && (
        <Flex row justifyContent="space-between" width="100%">
          <Text color="$neutral2" variant="body3">
            {t('swap.warning.networkFee.allow', { inputTokenSymbol })}
          </Text>
          <Text variant="body3">{approvalFeeFormatted}</Text>
        </Flex>
      )}
      <Flex row justifyContent="space-between" width="100%">
        <Text color="$neutral2" variant="body3">
          {t('common.button.swap')}
        </Text>
        <UniswapXFee gasFee={swapFeeFormatted} />
      </Flex>
    </Flex>
  )
}
