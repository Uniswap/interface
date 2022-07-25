import React from 'react'
import { Trans } from '@lingui/macro'

import { NETWORKS_INFO, MAINNET_NETWORKS } from '../../constants/networks'
import { useWalletModalToggle } from '../../state/application/hooks'

import { ChainId } from '@kyberswap/ks-sdk-core'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { Flex, Text } from 'rebass'
import { X } from 'react-feather'
import useTheme from 'hooks/useTheme'

import { Wrapper, NetworkList, NetworkLabel, ListItem, SelectNetworkButton } from 'components/NetworkModal'

export default function WrongNetworkModal(): JSX.Element | null {
  const toggleWalletModal = useWalletModalToggle()
  const { changeNetwork } = useActiveNetwork()
  const theme = useTheme()

  return (
    <Wrapper>
      <Flex alignItems="center" justifyContent="space-between">
        <Text fontWeight="500" fontSize={20}>
          <Trans>Wrong Network</Trans>
        </Text>

        <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleWalletModal}>
          <X />
        </Flex>
      </Flex>
      <Text fontWeight="500" fontSize={16} color={theme.subText} marginTop={14}>
        <Trans>Please connect to the appropriate network.</Trans>
      </Text>
      <NetworkList>
        {MAINNET_NETWORKS.map((key: ChainId, i: number) => {
          return (
            <SelectNetworkButton
              key={i}
              padding="0"
              onClick={() => {
                toggleWalletModal()
                changeNetwork(key)
              }}
            >
              <ListItem>
                <img src={NETWORKS_INFO[key].icon} alt="Switch Network" style={{ width: '24px', marginRight: '8px' }} />
                <NetworkLabel>{NETWORKS_INFO[key].name}</NetworkLabel>
              </ListItem>
            </SelectNetworkButton>
          )
        })}
      </NetworkList>
    </Wrapper>
  )
}
