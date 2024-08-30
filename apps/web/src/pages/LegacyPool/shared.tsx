import { DropdownSelector } from 'components/DropdownSelector'
import { Pool } from 'components/Icons/Pool'
import { useState } from 'react'
import { Anchor, styled, Text } from 'ui/src'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
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
  [ProtocolVersion.V3]: 'v3',
  [ProtocolVersion.V2]: 'v2',
}

export function PoolVersionMenu({ protocolVersion }: { protocolVersion: ProtocolVersion }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownSelector
      isOpen={isOpen}
      menuLabel={<Text variant="body1">{titles[protocolVersion]}</Text>}
      internalMenuItems={
        <>
          {Object.values(menuItems)
            .filter((pool) => pool.title === menuItems[ProtocolVersion.V3].title)
            .map((protocol) => (
              <PoolVersionItem href={protocol.link} key={protocol.title}>
                <Pool width="20px" height="20px" />
                <Text variant="body1" style={{ color: 'inherit' }}>
                  {protocol.title}
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
