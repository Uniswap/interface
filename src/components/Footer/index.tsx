import React from 'react'
import styled from 'styled-components'
import { Send } from 'react-feather'
import { Link } from '../../theme/components'

import { ButtonSecondary } from '../Button'

const FooterFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

export default function Footer() {
  return (
    <FooterFrame>
      <ButtonSecondary
        style={{
          padding: ' 8px 12px',
          marginRight: '0px',
          width: 'fit-content'
        }}
        href="https://forms.gle/DaLuqvJsVhVaAM3J9"
      >
        <Link href="https://forms.gle/DaLuqvJsVhVaAM3J9">
          <Send size={16} style={{ marginRight: '8px' }} /> Feedback
        </Link>
      </ButtonSecondary>
    </FooterFrame>
  )
}
