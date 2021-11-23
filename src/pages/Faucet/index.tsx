import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { ChevronDown } from 'react-feather'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components/macro'

import { FaucetContract } from '../../abis/types'
import { ButtonSecondary } from '../../components/Button'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import FaucetAddressInputPanel from '../../components/faucet/FaucetAddressInputPanel'
import FaucetDropDown from '../../components/faucet/FaucetDropDown'
import { RowBetween } from '../../components/Row'
import { useFaucetContract } from '../../hooks/useContract'
import { useActiveWeb3React } from '../../hooks/web3'
import { useSingleCallResult } from '../../state/multicall/hooks'
import { useDefaultsFromURLSearch } from '../../state/swap/hooks'
import { TYPE } from '../../theme'

const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.text2};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  `};
`
export const Wrapper = styled.div`
  display: flex;
  position: relative;
  padding: 8px;
  max-width: 870px;
  width: 100%;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 800px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 500px;
  `};
`

const FormWrapper = styled.div`
  width: 100%;
  position: relative;
  //flex: 1;
  background: ${({ theme }) => theme.bg0};
  padding: 1rem;
  border-radius: 1.25rem;
`

const Form = styled.form`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.bg0};
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px;
`

const faucetTokens = [
  {
    name: 'UzhUniToken',
    address: '0xE771E7A06abDC5176C9D20365c844680dC75b173',
    logo: '',
  },
  {
    name: 'UZHSushi',
    address: '0x8182965A5dC302e6b25b2b177c7CCa42C5099795',
    logo: '',
  },
  {
    name: 'UZHCro',
    address: '0x90aF2F7f19A93fc80D4F983218C56Bc2f8544989',
    logo: '',
  },
  {
    name: 'Incoingnito',
    address: '0xEe9E427945A073c9C8801dC5da44a276aF339333',
    logo: '',
  },
  {
    name: 'Intellicoin',
    address: '0x2A35E060849Fa56Ba648C93a50E23359b5d14515',
    logo: '',
  },
  {
    name: 'Privatepedia',
    address: '0x5e1bcb66D6CbFA4F98bB63BaF4357a543232BFbc',
    logo: '',
  },
  {
    name: 'Coinicious',
    address: '0xC486C817bE36F9ccf257BfF86CC33ff71a69D651',
    logo: '',
  },
  {
    name: 'Cryptofficialcoin',
    address: '0xd0b00725255C35514A8d702b4B4F78C141E8B5eF',
    logo: '',
  },
]

export default function Faucet() {
  const { account, error } = useActiveWeb3React()
  const faucetContract = useFaucetContract()
  const loadedUrlParams = useDefaultsFromURLSearch()

  const [selectedToken, setSelectedToken] = useState(faucetTokens[0].name)
  const [selectedTokenAddress, setSelectedTokenAddress] = useState(faucetTokens[0].address)

  const faucetState = useSingleCallResult(faucetContract, 'claim', [selectedTokenAddress])

  // const handleSubmit = (event: MouseEvent<HTMLButtonElement>) => {
  //   console.log('Faucet claim request send!')
  // }
  const claimTokenFaucet = async () => {
    if (faucetContract) {
      await faucetContract.claim(selectedTokenAddress)
    } else {
      throw new Error('Claim faucet did not work')
    }
    // if (!faucetContract) {
    //   console.log('contract not initialized')
    // }
    // console.log(faucetState)
    // faucetContract
    //   ?.claim(selectedTokenAddress)
    //   .then((tx) => {
    //     console.log(tx)
    //   })
    //   .catch((err) => {
    //     console.log(err)
    //   })
  }

  return (
    <>
      <Wrapper>
        <ColumnCenter style={{ justifyContent: 'center' }}>
          <TitleRow style={{ marginTop: '1rem', justifyContent: 'center', marginBottom: '2rem' }} padding={'0'}>
            <TYPE.body fontSize={'20px'} style={{ justifyContent: 'center' }}>
              <Trans>UZH Ethereum Faucet</Trans>
            </TYPE.body>
          </TitleRow>
          <FormWrapper>
            <Form>
              <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '30%', gap: '8px' }}>
                  <div>
                    <Trans>Select Token</Trans>
                  </div>
                  <FaucetDropDown
                    currentToken={selectedToken}
                    updateCurrentToken={setSelectedToken}
                    updateSelectedTokenAddress={setSelectedTokenAddress}
                    availableTokens={faucetTokens}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', width: '70%', gap: '8px' }}>
                  <Trans>Token contract address</Trans>
                  <FaucetAddressInputPanel tokenAddress={selectedTokenAddress} />
                </div>
              </div>
              <div style={{ display: 'flex', width: '100%', gap: '30px', alignItems: 'center' }}>
                <ButtonSecondary style={{ width: '30%', height: '60%' }} onClick={claimTokenFaucet}>
                  Send request!
                </ButtonSecondary>
                <div style={{ width: '70%' }}>
                  <Trans>How it works</Trans>
                  <p>
                    You can send a faucet request every 60 seconds. To do so, you need to provide a valid account
                    address
                  </p>
                </div>
              </div>
            </Form>
          </FormWrapper>
        </ColumnCenter>
      </Wrapper>
    </>
  )
}
