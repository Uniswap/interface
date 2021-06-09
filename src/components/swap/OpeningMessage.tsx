import React from 'react'
import styled from 'styled-components'
import { AutoColumn } from '../Column'
import { Row, RowBetween } from '../Row'
import { Text } from 'rebass'
import { AppState } from '../../state'
import { useSelector } from 'react-redux'
import { estimateGasCosts } from '../../state/gasprice/hooks'
import { ExternalLink } from '../../theme'

const AdvancedDetailsHeader = styled.div<{ show: boolean }>`
  padding-top: calc(5px + 1rem);
  padding-bottom: 50px;
  padding-left: 10px;
  padding-right: 10px;
  margin-bottom: -2rem;
  width: 100%;
  max-width: 400px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  z-index: -1;
  vertical-align: 'text-top';

  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  transition: transform 300ms ease-in-out;
`

export default function OpeningMessage() {
  const state = useSelector<AppState, AppState['gasprice']>(state => state.gasprice)

  const { lowestEstimateInGwei } = estimateGasCosts(state)

  //   .main-title {
  //     font-family: "Roboto Mono", monospace;
  //     max-width: 350px;
  //     margin: 170px 0 80px 0;
  //     font-size: 68px;
  //     color: white;
  //     padding-bottom: 10px;
  // }

  return (
    <AdvancedDetailsHeader show={true}>
      <Text fontSize={68}></Text>
      <AutoColumn gap={'md'}>
        {/* <RowBetween align="flex-start">
          <Text fontSize={12} fontWeight={'bold'} margin={'0 auto'}>
            {'Swap DAI to ETH via any.sender.'}
          </Text>
        </RowBetween> */}
        {/* <RowBetween align="flex-start">
          <Text fontSize={12} fontWeight={500} margin={'0 auto'}>
            {'Fast rate is ~' + utils.formatUnits(state.fast, 'gwei') + ' gwei (etherchain). '}
          </Text>
        </RowBetween> */}
        {/* <RowBetween align="flex-start">
          <Text fontSize={12} fontWeight={500} margin={'0 auto'}>
            {'any.sender will send the transaction at ~' +
              lowestEstimateInGwei +
              ' gwei before quickly increasing the network fee. Optimistically catching super-low fees. '}
          </Text>
        </RowBetween> */}
        {/* <RowBetween align="flex-start">
          <Text fontSize={12} fontWeight={'bold'} margin={'0 auto'}>
            {'Out of ETH but still have DAI? '}
          </Text>
        </RowBetween> */}
        <RowBetween align="flex-start">
          <Text fontSize={12} fontWeight={500} margin={'0 auto'}>
            <ExternalLink href="https://anydot.dev">
              <span style={{ color: '#1133db' }}>{'any.sender'}</span>
            </ExternalLink>
            {
              ' will pay the transaction fee for you to swap some DAI into ETH and then refund ourselves from the trade.'
            }
          </Text>
        </RowBetween>
        <Row align="flex-start">
          <Text fontSize={12} fontWeight={500}>
            {'This is an unaudited beta project. Check our '}
            <ExternalLink href="https://etherscan.io/address/0xb4407a8a0bc8e41fe269963a282c8829c9b975fa#code">
              <span style={{ color: '#1133db' }}>{'modified router contract '}</span>
            </ExternalLink>
            {'and use at your own risk.'}
          </Text>
        </Row>

        <Row align="flex-start">
          <Text fontSize={12} fontWeight={500}>
            {'Want Ropsten DAI or to chat with us?'}
            <ExternalLink href="https://t.me/anydotsender">
              <span style={{ color: '#1133db' }}>{' Join us on Telegram.'}</span>
            </ExternalLink>
          </Text>
        </Row>

        {/* <RowBetween align="flex-start">
          <Text fontSize={12} fontWeight={500} margin={'0 auto'}>
            {
              'Current gas prices are at XXX, which means a Uniswap trade costs around XXX. So you’ll need to trade at least XXX Dai just to cover the gas costs of the trade. Additionally, we take ~2% of the gas costs as a service fee.'
            }
          </Text>
        </RowBetween> */}
      </AutoColumn>{' '}
    </AdvancedDetailsHeader>
  )
}
