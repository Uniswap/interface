import { Trans } from '@lingui/macro'
import { CSSProperties, Dispatch, SetStateAction, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { X } from 'react-feather'
import { Flex, Image, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as ChevronDown } from 'assets/svg/down.svg'
import Kyber from 'components/Icons/Kyber'
import TrueSightNetworkModal from 'components/TrueSightNetworkModal'
import { NETWORKS_INFO, TRENDING_SOON_SUPPORTED_NETWORKS } from 'constants/networks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { TrueSightFilter } from 'pages/TrueSight/index'
import { OptionsContainer } from 'pages/TrueSight/styled'
import { useTrueSightNetworkModalToggle } from 'state/application/hooks'

const NetworkSelectContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  position: relative;
  border-radius: 999px;
  background: ${({ theme }) => theme.background};
  min-width: 160px;
  cursor: pointer;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-width: unset;
    width: 100%;
  `}
`

const NetworkSelect = ({
  filter,
  setFilter,
  style,
}: {
  filter: TrueSightFilter
  setFilter: Dispatch<SetStateAction<TrueSightFilter>>
  style?: CSSProperties
}) => {
  const theme = useTheme()

  const { selectedNetwork } = filter
  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(containerRef, () => !isMobile && setIsShowOptions(false))

  const toggleTrueSightNetworkModal = useTrueSightNetworkModalToggle()

  return (
    <NetworkSelectContainer
      role="button"
      onClick={() => {
        if (isMobile) {
          toggleTrueSightNetworkModal()
        } else {
          setIsShowOptions(prev => !prev)
        }
      }}
      ref={containerRef}
      style={style}
    >
      <Flex alignItems="center" style={{ gap: '8px' }}>
        {selectedNetwork ? (
          <Image minHeight={20} minWidth={20} height={20} width={20} src={NETWORKS_INFO[selectedNetwork].icon} />
        ) : (
          <Kyber size={24} color={theme.border} />
        )}
        <Text color={selectedNetwork ? theme.subText : theme.border} fontSize="14px" lineHeight="24px">
          {selectedNetwork ? NETWORKS_INFO[selectedNetwork].name : <Trans>All Chains</Trans>}
        </Text>
      </Flex>
      <Flex alignItems="center">
        {selectedNetwork ? (
          <X
            size={16}
            color={theme.subText}
            onClick={e => {
              e.stopPropagation()
              setFilter(prev => ({ ...prev, selectedNetwork: undefined }))
            }}
          />
        ) : (
          <ChevronDown
            color={theme.border}
            style={{ transform: `rotate(${isShowOptions ? '180deg' : 0})`, transition: 'transform 0.2s' }}
          />
        )}
      </Flex>

      <TrueSightNetworkModal filter={filter} setFilter={setFilter} />

      {isShowOptions && !isMobile && (
        <OptionsContainer>
          {Object.values(TRENDING_SOON_SUPPORTED_NETWORKS).map((network, index) => (
            <Flex
              key={index}
              alignItems="center"
              style={{ gap: '4px' }}
              onClick={() => {
                setFilter(prev => ({ ...prev, selectedNetwork: network }))
              }}
            >
              <Image minHeight={16} minWidth={16} height={16} width={16} src={NETWORKS_INFO[network].icon} />
              <Text key={index} color={theme.subText} fontSize="12px">
                {NETWORKS_INFO[network].name}
              </Text>
            </Flex>
          ))}
        </OptionsContainer>
      )}
    </NetworkSelectContainer>
  )
}

export default NetworkSelect
