import React from 'react'
import { withRouter } from 'react-router'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import DoubleLogo from '../components/DoubleLogo'

function Migrate() {
  return (
    <div style={{ paddingTop: '10px', display: 'grid', gridRowGap: '60px', gridTemplateRows: 'auto' }}>
      <Button size={'large'} success={true} disabled={false}>
        Large Sucess
      </Button>
      <Button size={'small'} success={false} disabled={false}>
        Small
      </Button>
      <Button size={'full'}>Full</Button>
      <Card variant="outlined" pink={true}>
        Outlined Pink
      </Card>
      <Card>Default</Card>
      <Card variant="outlined">Outlined</Card>
      <div>
        <Badge color={'#F3BE1E'}>V1</Badge>
      </div>
      <div>
        <Badge color={'#27AE60'}>Other Color</Badge>
      </div>
      <DoubleLogo
        size={'40px'}
        addressOne={'0x0D8775F648430679A709E98d2b0Cb6250d2887EF'}
        addressTwo={'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'}
      />
    </div>
  )
}

export default withRouter(Migrate)
