import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { EmptyNFTWalletIcon } from 'nft/components/icons'
import { headlineMedium } from 'nft/css/common.css'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { shortenAddress } from 'utils'

const EmptyWalletContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 190px 0px;
  flex-wrap: wrap;
`

const EmptyWalletText = styled.div`
  white-space: normal;
  margin-top: 12px;
  text-align: center;
`

const ExploreNFTsButton = styled.button`
  background-color: ${({ theme }) => theme.accentAction};
  padding: 10px 24px;
  color: ${({ theme }) => theme.white};
  width: min-content;
  border: none;
  outline: none;
  border-radius: 12px;
  white-space: nowrap;
  cursor: pointer;
  margin-top: 20px;
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
`

export const EmptyWalletContent = () => {
  const { account, ENSName } = useWeb3React()
  const navigate = useNavigate()
  return (
    <EmptyWalletContainer>
      <EmptyNFTWalletIcon />
      <EmptyWalletText className={headlineMedium}>
        <Trans>No NFTs in</Trans>&nbsp;{ENSName || shortenAddress(account ?? '')}
      </EmptyWalletText>
      <ExploreNFTsButton data-testid="nft-explore-nfts-button" onClick={() => navigate('/nfts')}>
        <Trans>Explore NFTs</Trans>
      </ExploreNFTsButton>
    </EmptyWalletContainer>
  )
}
