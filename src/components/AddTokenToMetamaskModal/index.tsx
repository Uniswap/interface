import React, { useContext } from 'react'
import { Currency } from '@fuseio/fuse-swap-sdk'
import { ArrowUpCircle } from 'react-feather'
import styled, { ThemeContext } from 'styled-components'
import { Text } from 'rebass'
import Modal from '../Modal'
import { AutoColumn, ColumnCenter } from '../Column'
import AddTokenToMetamaskButton from '../AddTokenToMetamaskButton'
import { ButtonPrimary } from '../Button'

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

export default function AddTokenToMetamaskModal({
  isOpen,
  setIsOpen,
  currency
}: {
  isOpen: boolean
  setIsOpen: (val: boolean) => void
  chainId?: number
  currency?: Currency
  hash?: string
}) {
  const theme = useContext(ThemeContext)

  const handleDismiss = () => setIsOpen(false)

  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss} maxHeight={90}>
      <Wrapper>
        <Section>
          <ConfirmedIcon>
            <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.primary1} />
          </ConfirmedIcon>
          <AutoColumn gap="12px" justify={'center'}>
            <Text fontWeight={500} fontSize={20}>
              Bridge Transaction Successful
            </Text>

            <AddTokenToMetamaskButton currency={currency} />

            <ButtonPrimary onClick={handleDismiss} style={{ margin: '20px 0 0 0' }}>
              <Text fontWeight={500} fontSize={20}>
                Close
              </Text>
            </ButtonPrimary>
          </AutoColumn>
        </Section>
      </Wrapper>
    </Modal>
  )
}
