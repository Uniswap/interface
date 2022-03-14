import React, { CSSProperties, useRef, useState } from 'react'
import { Flex, Image, Text } from 'rebass'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { ChevronDown, X } from 'react-feather'
import styled from 'styled-components'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { OptionsContainer } from 'pages/TrueSight/styled'
import { ChainId } from '@dynamic-amm/sdk'
import { NETWORK_ICON, NETWORK_LABEL } from 'constants/networks'

const NetworkSelectContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 10px 12px;
  position: relative;
  border-radius: 4px;
  background: ${({ theme }) => theme.background};
  min-width: 140px;
  cursor: pointer;
  display: none;
`

const NETWORKS = [
  ChainId.MAINNET,
  ChainId.BSCMAINNET,
  ChainId.MATIC,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOS,
]

const NetworkSelect = ({ style }: { style?: CSSProperties }) => {
  const theme = useTheme()
  const [isShowOptions, setIsShowOptions] = useState(false)
  const [selectedNetwork, setSelectNetwork] = useState<ChainId>()
  const containerRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  return (
    <NetworkSelectContainer onClick={() => setIsShowOptions(prev => !prev)} ref={containerRef} style={style}>
      <Flex alignItems="center" style={{ gap: '4px' }}>
        {selectedNetwork && (
          <Image minHeight={16} minWidth={16} height={16} width={16} src={NETWORK_ICON[selectedNetwork]} />
        )}
        <Text color={selectedNetwork ? theme.subText : theme.disableText} fontSize="12px">
          {selectedNetwork ? NETWORK_LABEL[selectedNetwork] : <Trans>Filter by Network</Trans>}
        </Text>
      </Flex>
      <Flex alignItems="center">
        {selectedNetwork && (
          <X
            size={16}
            color={theme.disableText}
            onClick={e => {
              e.stopPropagation()
              setSelectNetwork(undefined)
            }}
          />
        )}
        <ChevronDown size={16} color={theme.disableText} />
      </Flex>
      {isShowOptions && (
        <OptionsContainer>
          {NETWORKS.map((network, index) => (
            <Flex
              alignItems="center"
              style={{ gap: '4px' }}
              onClick={() => {
                setSelectNetwork(network)
              }}
            >
              <Image minHeight={16} minWidth={16} height={16} width={16} src={NETWORK_ICON[network]} />
              <Text key={index} color={theme.subText} fontSize="12px">
                <Trans>{NETWORK_LABEL[network]}</Trans>
              </Text>
            </Flex>
          ))}
        </OptionsContainer>
      )}
    </NetworkSelectContainer>
  )
}

export default NetworkSelect
