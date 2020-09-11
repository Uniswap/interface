import React, { useState, useCallback } from 'react'
import Modal from '../Modal'
import { RowBetween } from '../Row'
import styled from 'styled-components'
import { AutoColumn, ColumnCenter } from '../Column'
import { ExternalLink } from '../../theme'
import { ButtonError } from '../Button'

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

const StyledText = styled.div<{ size?: number }>`
  font-size: ${({ size }) => (size ? size + 'px' : '24px')};
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: ${({ theme }) => theme.text3};
`

const Content = styled(RowBetween)`
  margin-top: 5em;
  margin-bottom: 0.5em;
`

const RegionContent = styled(RowBetween)`
  margin-bottom: 1em;
`

export default function TermsAndConditionsModal() {
  const tAndC = localStorage.getItem('tAndc') || 'false'
  const [isOpen, setIsOpen] = useState(tAndC === 'false')
  const [understandChecked, setUnderstandChecked] = useState(false)
  const [regionChecked, setRegionChecked] = useState(false)
  const toggleUnderstand = useCallback(() => setUnderstandChecked(uc => !uc), [])
  const toggleRegionCheck = useCallback(() => setRegionChecked(c => !c), [])

  function onConfirm() {
    localStorage.setItem('tAndc', 'true')
    setIsOpen(false)
  }

  function onDismiss() {
    null
  }

  const buttonEnabled = understandChecked && regionChecked
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      <Wrapper>
        <Section>
          <RowBetween>
            <StyledText size={24}>DeFi Swap Protocol</StyledText>
          </RowBetween>
          <Content>
            <div>
              <label style={{ cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  className="understand-checkbox"
                  checked={understandChecked}
                  onChange={toggleUnderstand}
                />{' '}
                I understand and agree to the{' '}
                <ExternalLink href={`${process.env.PUBLIC_URL || ''}/swap-terms`}>
                  DeFi Swap Protocol Terms.
                </ExternalLink>
              </label>
            </div>
          </Content>
          <RegionContent>
            <div>
              <label style={{ cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  className="understand-checkbox"
                  checked={regionChecked}
                  onChange={toggleRegionCheck}
                />{' '}
                I am not a citizen or resident of any of the countries listed{' '}
                <ExternalLink href={`http://help.crypto.com/en/articles/4429907-defi-swap-geo-restrictions`}>
                  here
                </ExternalLink>
              </label>
            </div>
          </RegionContent>
          <RowBetween>
            <ColumnCenter>
              <ButtonError
                disabled={!buttonEnabled}
                error={true}
                width={'100%'}
                height={'57px'}
                padding="0.5rem 1rem"
                className="tnc-consent-button"
                style={{
                  borderRadius: '20px'
                }}
                onClick={() => {
                  onConfirm()
                }}
              >
                Next
              </ButtonError>
            </ColumnCenter>
          </RowBetween>
        </Section>
      </Wrapper>
    </Modal>
  )
}
