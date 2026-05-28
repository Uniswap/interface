import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, FlexProps, Text } from 'ui/src'
import { ArrowDownCircleFilled } from 'ui/src/components/icons/ArrowDownCircleFilled'
import { ChartBar } from 'ui/src/components/icons/ChartBar'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { Plus } from 'ui/src/components/icons/Plus'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { ActionTileWithIconAnimation } from '~/components/ActionTiles/ActionTileWithIconAnimation'
import { AdaptiveDropdown } from '~/components/Dropdowns/AdaptiveDropdown'
import { InternalMenuItem } from '~/components/Dropdowns/Dropdown'

export function MoreActionTile({ padding = '$spacing12' }: { padding?: FlexProps['p'] }) {
  const { t } = useTranslation()
  const { navigateToSwapFlow } = useUniswapContext()
  const navigate = useNavigate()
  const { value: isDropdownOpen, setFalse: closeDropdown, toggle: toggleDropdown } = useBooleanState(false)

  const onPressSwap = useEvent(() => {
    navigateToSwapFlow({})
    closeDropdown()
  })

  const onPressSell = useEvent(() => {
    navigate('/sell')
    closeDropdown()
  })

  const onPressLimit = useEvent(() => {
    navigate('/limit')
    closeDropdown()
  })

  const onPressCreatePool = useEvent(() => {
    navigate('/positions/create')
    closeDropdown()
  })

  return (
    <AdaptiveDropdown
      isOpen={isDropdownOpen}
      toggleOpen={toggleDropdown}
      trigger={
        <Flex width="100%">
          <ActionTileWithIconAnimation
            dataTestId={TestID.PortfolioActionTileMore}
            Icon={MoreHorizontal}
            name={t('common.more')}
            onClick={toggleDropdown}
            padding={padding}
          />
        </Flex>
      }
      containerStyle={{ height: '100%' }}
      alignRight={false}
    >
      <Trace logPress element={ElementName.PortfolioActionSwap}>
        <InternalMenuItem onPress={onPressSwap}>
          <Flex row alignItems="center" gap="$gap8">
            <CoinConvert size="$icon.16" color="$neutral2" />
            <Text variant="buttonLabel3">{t('common.swap')}</Text>
          </Flex>
        </InternalMenuItem>
      </Trace>

      <Trace logPress element={ElementName.PortfolioActionSell}>
        <InternalMenuItem onPress={onPressSell}>
          <Flex row alignItems="center" gap="$gap8">
            <ArrowDownCircleFilled size="$icon.16" color="$neutral2" transform="rotate(180deg)" />
            <Text variant="buttonLabel3">{t('common.sell.label')}</Text>
          </Flex>
        </InternalMenuItem>
      </Trace>

      <Trace logPress element={ElementName.PortfolioActionLimit}>
        <InternalMenuItem onPress={onPressLimit}>
          <Flex row alignItems="center" gap="$gap8">
            <ChartBar size="$icon.16" color="$neutral2" />
            <Text variant="buttonLabel3">{t('swap.limit')}</Text>
          </Flex>
        </InternalMenuItem>
      </Trace>

      <Trace logPress element={ElementName.PortfolioActionPosition}>
        <InternalMenuItem onPress={onPressCreatePool}>
          <Flex row alignItems="center" gap="$gap8">
            <Plus size="$icon.16" color="$neutral2" />
            <Text variant="buttonLabel3">{t('pool.newPosition.title')}</Text>
          </Flex>
        </InternalMenuItem>
      </Trace>
    </AdaptiveDropdown>
  )
}
