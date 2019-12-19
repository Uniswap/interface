import React from 'react'
import { withRouter } from 'react-router'
import Button, { ButtonDropwdown } from '../components/Button'
import Card from '../components/Card'
import Icon from '../components/Icon'
import DoubleLogo from '../components/DoubleLogo'
import ButtonStyled, { ButtonStyledSecondary } from '../components/ButtonStyled'

function Demo() {
  return (
    <div style={{ paddingTop: '10px', display: 'grid', gridRowGap: '60px', gridTemplateRows: 'auto' }}>
      <Button>default button</Button>
      <Button disabled={true}>disabled button</Button>
      <Button variant="success">success button</Button>
      <Button rounded={true}>Rounded button</Button>
      <Button variant="secondary">secondary button</Button>
      <ButtonDropwdown width={'140px'}>Button Icon</ButtonDropwdown>
      <ButtonDropwdown width={'fit-content'} variant="secondary">
        Button Icon Secondary
      </ButtonDropwdown>
      <ButtonDropwdown width={'180px'} variant="dull">
        <DoubleLogo
          size={'24px'}
          addressTwo={'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'}
          addressOne={'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'}
        />
        {' DAI'}
      </ButtonDropwdown>
      <ButtonDropwdown variant="hollow" width={'fit-content'} />
      <Button variant="secondary" disabled={true}>
        disabled secondary button
      </Button>
      <Card p={'1rem'} outlined={true}>
        Outlined card
      </Card>
      <Card p={'1rem'} outlined={true} variant="pink">
        Outlined card
      </Card>
      <ButtonStyled>Button With Styled components</ButtonStyled>
      <ButtonStyledSecondary>Secondary With SC</ButtonStyledSecondary>
    </div>
  )
}

export default withRouter(Demo)
