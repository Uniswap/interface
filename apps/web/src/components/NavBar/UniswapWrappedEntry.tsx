import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { Flex, Text, Tooltip } from 'ui/src'
import { Snowflake } from 'ui/src/components/icons/Snowflake'
import { zIndexes } from 'ui/src/theme'
import { WRAPPED_PATH } from 'uniswap/src/components/banners/shared/utils'
import { selectHasDismissedUniswapWrapped2025Banner } from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasDismissedUniswapWrapped2025Banner } from 'uniswap/src/features/behaviorHistory/slice'
import { isMobileWeb } from 'utilities/src/platform'

const snowflakeHoverKeyframes = `
  @keyframes snowflakeHover {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(180deg);
    }
  }

  .snowflake-icon {
    cursor: pointer;
    transition: color 300ms ease;
  }

  @media (hover: hover) {
    .snowflake-icon:hover {
      animation: snowflakeHover 300ms ease;
    }
  }
`

export function UniswapWrappedEntry() {
  const isUniswapWrapped2025Enabled = useFeatureFlag(FeatureFlags.UniswapWrapped2025)
  const isDismissed = useAppSelector(selectHasDismissedUniswapWrapped2025Banner)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handlePress = useCallback(() => {
    dispatch(setHasDismissedUniswapWrapped2025Banner(true))
    navigate(WRAPPED_PATH)
  }, [dispatch, navigate])

  return (
    isUniswapWrapped2025Enabled &&
    isDismissed && (
      <>
        <style>{snowflakeHoverKeyframes}</style>
        <Tooltip placement="bottom" offset={{ mainAxis: 8 }} delay={{ open: 300 }}>
          <Tooltip.Trigger>
            <Text
              className="snowflake-icon"
              color="$neutral2"
              hoverStyle={{ color: '$accent1' }}
              height="$spacing24"
              onPress={handlePress}
            >
              <Snowflake size="$icon.24" color="inherit" />
            </Text>
          </Tooltip.Trigger>
          <Tooltip.Content zIndex={zIndexes.overlay} display={isMobileWeb ? 'none' : 'flex'}>
            <Tooltip.Arrow />
            <Flex centered>
              <Text variant="buttonLabel4" color="$accent1">
                {t('home.banner.uniswapWrapped2025.title')}
              </Text>
              <Text variant="body4" color="$neutral2">
                {t('home.banner.uniswapWrapped2025.subtitle')}
              </Text>
            </Flex>
          </Tooltip.Content>
        </Tooltip>
      </>
    )
  )
}
