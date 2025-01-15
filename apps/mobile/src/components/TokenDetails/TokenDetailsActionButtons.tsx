import React from 'react'
import { useTranslation } from 'react-i18next'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { DeprecatedButton, Flex, GeneratedIcon, useSporeColors } from 'ui/src'
import { SwapCoin } from 'ui/src/components/icons'
import { opacify, validColor } from 'ui/src/theme'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useTokenBasicProjectPartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ElementNameType, SectionName } from 'uniswap/src/features/telemetry/constants'
import { TestID, TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { getContrastPassingTextColor } from 'uniswap/src/utils/colors'

function CTAButton({
  title,
  element,
  onPress,
  onPressDisabled,
  testID,
  tokenColor,
  disabled,
  icon,
}: {
  title: string
  element: ElementNameType
  onPress: () => void
  onPressDisabled?: () => void
  testID?: TestIDType
  tokenColor?: Maybe<string>
  disabled?: boolean
  icon?: GeneratedIcon
}): JSX.Element {
  const colors = useSporeColors()
  return (
    <Trace logPress element={element} section={SectionName.TokenDetails}>
      <DeprecatedButton
        fill
        icon={icon}
        opacity={disabled ? 0.5 : 1}
        color={tokenColor ? getContrastPassingTextColor(tokenColor) : '$white'}
        pressStyle={{ backgroundColor: validColor(opacify(60, tokenColor ?? colors.accent1.val)) }}
        size="large"
        backgroundColor={validColor(tokenColor) ?? '$accent1'}
        testID={testID}
        onPress={disabled ? onPressDisabled : onPress}
      >
        {title}
      </DeprecatedButton>
    </Trace>
  )
}

export function TokenDetailsActionButtons({
  onPressBuy,
  onPressSell,
  onPressSwap,
  onPressDisabled,
  userHasBalance,
}: {
  onPressBuy: () => void
  onPressSell: () => void
  onPressSwap: () => void
  onPressDisabled?: () => void
  userHasBalance: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const isOffRampEnabled = useFeatureFlag(FeatureFlags.FiatOffRamp)

  const { currencyId, currencyInfo, isChainEnabled, tokenColor } = useTokenDetailsContext()

  const project = useTokenBasicProjectPartsFragment({ currencyId }).data?.project

  const safetyLevel = project?.safetyLevel
  const isBlocked = safetyLevel === SafetyLevel.Blocked || currencyInfo?.safetyInfo?.tokenList === TokenList.Blocked

  const disabled = isBlocked || !isChainEnabled

  return (
    <Flex
      row
      backgroundColor="$surface1"
      borderTopColor="$surface3"
      borderTopWidth={1}
      gap="$spacing8"
      pb="$spacing16"
      pt="$spacing12"
      px="$spacing16"
    >
      {isOffRampEnabled ? (
        <CTAButton
          disabled={disabled}
          element={ElementName.Swap}
          testID={TestID.TokenDetailsSwapButton}
          title={t('common.button.swap')}
          tokenColor={tokenColor}
          icon={SwapCoin}
          onPress={onPressSwap}
          onPressDisabled={onPressDisabled}
        />
      ) : (
        <>
          <CTAButton
            disabled={disabled}
            element={ElementName.Buy}
            testID={TestID.TokenDetailsBuyButton}
            title={t('common.button.buy')}
            tokenColor={tokenColor}
            onPress={onPressBuy}
            onPressDisabled={onPressDisabled}
          />
          {userHasBalance && (
            <CTAButton
              disabled={disabled}
              element={ElementName.Sell}
              testID={TestID.TokenDetailsSellButton}
              title={t('common.button.sell')}
              tokenColor={tokenColor}
              onPress={onPressSell}
              onPressDisabled={onPressDisabled}
            />
          )}
        </>
      )}
    </Flex>
  )
}
