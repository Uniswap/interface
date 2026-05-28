import { isMobileApp } from '@universe/environment'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { InformationBanner } from 'uniswap/src/components/banners/InformationBanner'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { useTokenBalanceListContext } from 'uniswap/src/features/portfolio/TokenBalanceListContext'

function HiddenTokensRowInner({ onPressLearnMore }: { onPressLearnMore: () => void }): JSX.Element {
  const { t } = useTranslation()

  const { hiddenTokensCount, hiddenTokensExpanded, setHiddenTokensExpanded } = useTokenBalanceListContext()

  return (
    <Flex grow>
      <ExpandoRow
        isExpanded={hiddenTokensExpanded}
        label={t('hidden.tokens.info.text.button', { numHidden: hiddenTokensCount })}
        mx={isMobileApp ? '$spacing16' : undefined}
        onPress={(): void => {
          setHiddenTokensExpanded(!hiddenTokensExpanded)
        }}
      />
      {hiddenTokensExpanded && (
        <Flex mx={isMobileApp ? '$spacing12' : undefined}>
          <InformationBanner infoText={t('hidden.tokens.info.banner.text')} onPress={onPressLearnMore} />
        </Flex>
      )}
    </Flex>
  )
}

export const HiddenTokensRow = memo(HiddenTokensRowInner)
