import React, { ReactNode, useRef, useState } from 'react'
import { CheckCircle, ChevronDown, Copy } from 'react-feather'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'

import { NETWORKS_INFO, TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { OptionsContainer } from 'pages/TrueSight/styled'
import getShortenAddress from 'utils/getShortenAddress'

function AddressButtonItself({
  network,
  address,
  isInOptionContainer,
  isDisableChevronDown,
  optionRender,
  toggleShowOptions,
}: {
  network: string
  address: string
  isInOptionContainer?: boolean
  isDisableChevronDown?: boolean
  optionRender?: ReactNode
  toggleShowOptions?: () => void
}) {
  const theme = useTheme()
  const [isCopied, setCopied] = useCopyClipboard()

  const onCopy = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    setCopied(address)
  }

  const mappedChainId = network ? TRUESIGHT_NETWORK_TO_CHAINID[network] : undefined

  return (
    <StyledAddressButton isInOptionContainer={isInOptionContainer}>
      {address && mappedChainId && (
        <>
          <img src={NETWORKS_INFO[mappedChainId].icon} alt="Network" style={{ minWidth: '16px', width: '16px' }} />
          <AddressCopyContainer onClick={onCopy}>
            <div style={{ width: '90px' }}>{getShortenAddress(address)}</div>
            {isCopied ? <CheckCircle size={'14'} /> : <Copy size={'14'} />}
          </AddressCopyContainer>
          <ChevronDownWrapper
            style={{
              visibility: isInOptionContainer ? 'hidden' : 'visible',
            }}
            onClick={() => !isDisableChevronDown && toggleShowOptions && toggleShowOptions()}
          >
            <ChevronDown
              size="16px"
              cursor="pointer"
              color={isDisableChevronDown ? theme.disableText : theme.subText}
              style={{
                cursor: isDisableChevronDown ? 'not-allowed' : 'pointer',
              }}
            />
          </ChevronDownWrapper>
        </>
      )}
      {optionRender}
    </StyledAddressButton>
  )
}

export default function AddressButton({ platforms }: { platforms: Map<string, string> }) {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleShowOptions = () => platforms.size >= 2 && setIsShowOptions(prev => !prev)

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  const defaultNetwork = platforms.size ? platforms.keys().next().value : ''
  const defaultAddress = defaultNetwork ? platforms.get(defaultNetwork) ?? '' : ''

  const optionRender = isShowOptions ? (
    <OptionsContainer>
      {Array.from(platforms.keys())
        .slice(1)
        .map(network => (
          <AddressButtonItself
            key={network}
            network={network}
            address={platforms.get(network) ?? ''}
            isInOptionContainer={true}
            isDisableChevronDown={false}
          />
        ))}
    </OptionsContainer>
  ) : null

  if (platforms.size === 0) return null

  return (
    <Box ref={containerRef}>
      <AddressButtonItself
        network={defaultNetwork}
        address={defaultAddress}
        isInOptionContainer={false}
        isDisableChevronDown={platforms.size < 2}
        optionRender={optionRender}
        toggleShowOptions={toggleShowOptions}
      />
    </Box>
  )
}

const AddressCopyContainer = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    color: ${({ theme }) => theme.disableText};
  }
`

const ChevronDownWrapper = styled.div`
  &:hover {
    color: ${({ theme }) => theme.disableText};
  }
`

export const StyledAddressButton = styled(Flex)<{ isInOptionContainer?: boolean }>`
  align-items: center;
  padding: 4.5px 12px;
  gap: 6px;
  width: fit-content;
  font-size: 12px;
  line-height: 14px;
  color: ${({ theme }) => theme.subText};
  background: ${({ theme, isInOptionContainer }) => (isInOptionContainer ? 'transparent' : theme.buttonBlack)};
  border-radius: ${({ isInOptionContainer }) => (isInOptionContainer ? '0' : '16px')};
  position: relative;
`
