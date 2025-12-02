import { ActionTileWithIconAnimation } from 'components/ActionTiles/ActionTileWithIconAnimation'
import { AdaptiveDropdown } from 'components/Dropdowns/AdaptiveDropdown'
import { InternalMenuItem } from 'components/Dropdowns/Dropdown'
import { Limit } from 'components/Icons/Limit'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text, useSporeColors } from 'ui/src'
import { ArrowDownCircleFilled } from 'ui/src/components/icons/ArrowDownCircleFilled'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { Plus } from 'ui/src/components/icons/Plus'
import { FlexProps } from 'ui/src/components/layout/Flex'
import { iconSizes } from 'ui/src/theme'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function MoreActionTile({ padding = '$spacing12' }: { padding?: FlexProps['p'] }) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { navigateToReceive } = useUniswapContext()
  const navigate = useNavigate()
  const { value: isDropdownOpen, setFalse: closeDropdown, toggle: toggleDropdown } = useBooleanState(false)

  const onPressSell = useEvent(() => {
    navigate('/sell')
    closeDropdown()
  })

  const onPressReceive = useEvent(() => {
    navigateToReceive()
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
      <InternalMenuItem onPress={onPressSell}>
        <Flex row alignItems="center" gap="$gap8">
          <ArrowDownCircleFilled size="$icon.16" color="$neutral2" transform="rotate(180deg)" />
          <Text variant="buttonLabel3">{t('common.sell.label')}</Text>
        </Flex>
      </InternalMenuItem>

      <InternalMenuItem onPress={onPressReceive}>
        <Flex row alignItems="center" gap="$gap8">
          <ArrowDownCircleFilled size="$icon.16" color="$neutral2" />
          <Text variant="buttonLabel3">{t('common.receive')}</Text>
        </Flex>
      </InternalMenuItem>

      <InternalMenuItem onPress={onPressLimit}>
        <Flex row alignItems="center" gap="$gap8">
          <Limit width={iconSizes.icon16} height={iconSizes.icon16} fill={colors.neutral2.val} />
          <Text variant="buttonLabel3">{t('swap.limit')}</Text>
        </Flex>
      </InternalMenuItem>

      <InternalMenuItem onPress={onPressCreatePool}>
        <Flex row alignItems="center" gap="$gap8">
          <Plus size="$icon.16" color="$neutral2" />
          <Text variant="buttonLabel3">{t('pool.newPosition.title')}</Text>
        </Flex>
      </InternalMenuItem>
    </AdaptiveDropdown>
  )
}
