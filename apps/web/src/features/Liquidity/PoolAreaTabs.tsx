import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, Text, useMedia } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

type PoolAreaTabKey = 'positions' | 'pools' | 'hooks'

export function PoolAreaTabs({
  activeTab,
  urls,
  replace = false,
}: {
  activeTab: PoolAreaTabKey
  urls: Record<PoolAreaTabKey, string>
  replace?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const tabs = [
    {
      key: 'positions',
      label: media.md ? t('pool.positions') : t('pool.positions.title'),
      elementName: ElementName.PoolAreaTabPositions,
    },
    { key: 'pools', label: t('common.pools'), elementName: ElementName.PoolAreaTabPools },
    { key: 'hooks', label: t('hooks.title'), elementName: ElementName.PoolAreaTabHooks },
  ] as const

  return (
    <Flex
      role="navigation"
      aria-label={t('common.pools')}
      row
      width="100%"
      gap="$spacing36"
      borderBottomWidth={1}
      borderColor="$surface3"
    >
      {tabs.map(({ key, label, elementName }) => (
        <Trace key={key} logPress eventOnTrigger={SharedEventName.NAVBAR_CLICKED} element={elementName}>
          <Link
            to={urls[key]}
            replace={replace}
            aria-current={activeTab === key ? 'page' : undefined}
            style={{ textDecoration: 'none' }}
          >
            <Text
              variant="body1"
              display="block"
              color={activeTab === key ? '$neutral1' : '$neutral2'}
              pt="$spacing8"
              pb="$spacing12"
              borderBottomWidth={2}
              borderBottomColor={activeTab === key ? '$neutral1' : '$transparent'}
              hoverStyle={{ color: '$neutral1' }}
            >
              {label}
            </Text>
          </Link>
        </Trace>
      ))}
    </Flex>
  )
}
