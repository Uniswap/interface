import React from 'react'
import { withRouter } from 'react-router'
import Button from '../components/Button'
import Card from '../components/Card'
import { FullBanner } from '../components/Banner'
import DoubleLogo from '../components/DoubleLogo'
import ButtonStyled, {
  ButtonStyledSecondary,
  ButtonDropwdown,
  ButtonDropwdownSecondary,
  ButtonDropwdownDull
} from '../components/ButtonStyled'

function Demo() {
  return (
    <>
      <FullBanner>Full Sticky Banner</FullBanner>
      <div
        style={{
          paddingTop: '10px',
          paddingBottom: '100px',
          display: 'grid',
          gridRowGap: '60px',
          gridTemplateRows: 'auto'
        }}
      >
        <Button>default button</Button>
        <Button disabled={true}>disabled button</Button>
        <Button variant="success">success button</Button>
        <Button variant="secondary">secondary button</Button>
        <ButtonDropwdown width={140}>Button Icon</ButtonDropwdown>
        <ButtonDropwdownSecondary width={240}>Button Icon Secondary</ButtonDropwdownSecondary>
        <ButtonDropwdown width={160}>
          <DoubleLogo
            size={'24px'}
            addressTwo={'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'}
            addressOne={'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'}
          />
          <div style={{ marginLeft: '8px' }}>{'DAI'}</div>
        </ButtonDropwdown>
        <ButtonDropwdownDull width={'fit-content'} />
        <Card p={'1rem'} outlined={true}>
          Outlined card
        </Card>
        <Card p={'1rem'} outlined={true} variant="pink">
          Outlined card
        </Card>
        <ButtonStyled>Button With Styled components</ButtonStyled>
        <ButtonStyledSecondary width={200}>Secondary With SC</ButtonStyledSecondary>
      </div>
    </>
  )
}

export default withRouter(Demo)
