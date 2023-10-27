import { isAddress } from '@ethersproject/address'
import { parseEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { ChainId } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import Row from 'components/Row'
import { nativeOnChain } from 'constants/tokens'
import useENSAddress from 'hooks/useENSAddress'
import { pregenerateWallet } from 'hooks/usePregenerateWallet'
import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { Input as NumericalInput } from '../NumericalInput'

const InputWrapper = styled(Column)`
  height: 100px;
  padding: 32px 16px 16px 16px;
  justify-content: center;
  align-items: center;
  gap: 24px;
  align-self: stretch;
  border-radius: 16px;
  background: ${({ theme }) => theme.surface2};
`

const StyledInput = styled(NumericalInput)`
  height: 44px;
  // text-align: center;
  padding-right: 8px;
`

const AddressWrapper = styled(Column)`
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  border-radius: 16px;
  background: ${({ theme }) => theme.surface2};
`

const SendInput = styled.input`
  background: no-repeat scroll 7px 7px;
  background-size: 20px 20px;
  background-position: 12px center;
  position: relative;
  display: flex;
  height: 40px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.neutral1};
  -webkit-appearance: none;
  font-weight: 485;

  font-size: 16px;

  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
    font-size: 16px;
  }
`

export function Send() {
  const [sendAmount, setSendAmount] = useState('')
  const [sendAddress, setSendAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { wallets } = useWallets()
  const embeddedWallet = wallets.find((wallet: { walletClientType: string }) => wallet.walletClientType === 'privy')
  const nativeToken = nativeOnChain(
    embeddedWallet?.chainId?.split(':')?.[1] ? Number(embeddedWallet?.chainId?.split(':')?.[1]) : ChainId.MAINNET
  )

  const { sendTransaction } = usePrivy()
  const { address: ensAddress } = useENSAddress(sendAddress)

  const handleSendClick = useCallback(async () => {
    setIsLoading(true)

    const inputIsAddress = isAddress(sendAddress)
    const newAddress = await pregenerateWallet(sendAddress)
    const unsignedTx = {
      to: inputIsAddress ? sendAddress : ensAddress ?? newAddress,
      chainId: Number(embeddedWallet?.chainId),
      value: parseEther(sendAmount).toHexString(),
    }
    const uiConfig = {
      description: `Send ${sendAmount} ${nativeToken.symbol} to ${sendAddress}`,
      buttonText: 'Send',
    }

    const result = await sendTransaction(unsignedTx, uiConfig)

    if (result) {
      setIsLoading(false)
      setSendAddress('')
      setSendAmount('')
    }
  }, [embeddedWallet?.chainId, ensAddress, nativeToken.symbol, sendAddress, sendAmount, sendTransaction])
  return (
    <Column gap="xs">
      <InputWrapper>
        <Row>
          <StyledInput
            value={sendAmount}
            placeholder="0"
            onUserInput={(val) => {
              setSendAmount(val)
            }}
          />
          <ThemedText.HeadlineMedium>{nativeToken.symbol}</ThemedText.HeadlineMedium>
        </Row>
      </InputWrapper>
      <AddressWrapper>
        <ThemedText.BodyPrimary>
          <Trans>To</Trans>
        </ThemedText.BodyPrimary>
        <Row>
          <SendInput
            value={sendAddress}
            placeholder="ENS, email, or wallet address"
            onChange={(event) => {
              setSendAddress(event.target.value)
            }}
          />
        </Row>
      </AddressWrapper>
      <Row>
        <ButtonPrimary
          $borderRadius="16px"
          disabled={Boolean(!sendAddress || !sendAmount)}
          onClick={handleSendClick}
          fontWeight={535}
          data-testid="send-button"
        >
          <Trans>{isLoading ? <LoaderV3 size="24px" /> : 'Send'}</Trans>
        </ButtonPrimary>
      </Row>
    </Column>
  )
}
