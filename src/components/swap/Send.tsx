import { isAddress } from '@ethersproject/address'
import { parseEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { ChainId } from '@uniswap/sdk-core'
import Column from 'components/Column'
import Row from 'components/Row'
import { nativeOnChain } from 'constants/tokens'
import useENSAddress from 'hooks/useENSAddress'
import { pregenerateWallet } from 'hooks/usePregenerateWallet'
import { useCallback, useState } from 'react'
import { ChevronRight } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'

import { Input as NumericalInput } from '../NumericalInput'

const InputWrapper = styled(Column)`
  height: 236px;
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

const SendIcon = styled(ChevronRight)<{ $disabled?: boolean }>`
  color: ${({ theme, $disabled }) => ($disabled ? theme.neutral3 : theme.neutral2)};
  ${({ $disabled }) => !$disabled && ClickableStyle}
`

export function Send() {
  const [sendAmount, setSendAmount] = useState('')
  const [sendAddress, setSendAddress] = useState('')
  const { wallets } = useWallets()
  const embeddedWallet = wallets.find((wallet: { walletClientType: string }) => wallet.walletClientType === 'privy')
  const nativeToken = nativeOnChain(
    embeddedWallet?.chainId?.split(':')?.[1] ? Number(embeddedWallet?.chainId?.split(':')?.[1]) : ChainId.MAINNET
  )
  const { sendTransaction } = usePrivy()
  const { address: ensAddress } = useENSAddress(sendAddress)

  const handleSendClick = useCallback(async () => {
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
    await sendTransaction(unsignedTx, uiConfig)

    setSendAddress('')
    setSendAmount('')
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
          <SendIcon $disabled={!sendAddress} onClick={handleSendClick} />
        </Row>
      </AddressWrapper>
    </Column>
  )
}
