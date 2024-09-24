import { DropdownSelector } from 'components/DropdownSelector'
import { Pool } from 'components/Icons/Pool'
import { useState } from 'react'
import { Anchor, styled, Text } from 'ui/src'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { t } from 'uniswap/src/i18n'

const PoolVersionItem = styled(Anchor, {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',
  gap: '$gap12',
  textDecorationLine: 'none',
  color: '$neutral2',
  hoverStyle: {
    color: '$neutral1',
  },
})

const menuItems = {
  [ProtocolVersion.V4]: {
    title: t('pool.v4'),
    link: '/pool',
  },
  [ProtocolVersion.V3]: {
    title: t('pool.v3'),
    link: '/pool',
  },
  [ProtocolVersion.V2]: {
    title: t('pool.v2'),
    link: '/pools/v2',
  },
}

const titles = {
  [ProtocolVersion.V4]: 'v4',
  [ProtocolVersion.V3]: 'v3',
  [ProtocolVersion.V2]: 'v2',
}

export function PoolVersionMenu({ protocolVersion }: { protocolVersion: ProtocolVersion }) {
  const [isOpen, setIsOpen] = useState(false)
  const isV4Enabled = useFeatureFlag(FeatureFlags.V4Everywhere)

  return (
    <DropdownSelector
      isOpen={isOpen}
      menuLabel={<Text variant="body1">{titles[protocolVersion]}</Text>}
      internalMenuItems={
        <>
          {Object.entries(menuItems)
            .filter(([protocol, info]) => {
              if (!isV4Enabled && protocol === ProtocolVersion.V4) {
                return false
              }
              return info.title !== menuItems[protocolVersion].title
            })
            .map(([, info]) => (
              <PoolVersionItem href={info.link} key={info.title}>
                <Pool width="20px" height="20px" />
                <Text variant="body1" style={{ color: 'inherit' }}>
                  {info.title}
                </Text>
              </PoolVersionItem>
            ))}
        </>
      }
      toggleOpen={setIsOpen}
      buttonStyle={{ height: 36 }}
      adaptToSheet={false}
    />
  )
}
