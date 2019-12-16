import React from 'react'
import { withRouter } from 'react-router'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import DoubleLogo from '../components/DoubleLogo'

function Demo() {
  return (
    <div style={{ paddingTop: '10px', display: 'grid', gridRowGap: '60px', gridTemplateRows: 'auto' }}>
      <Button>default</Button>
      <Button variant="disabled">disabled</Button>
      <Button style={{ color: 'purple' }}>Custom Styles</Button>
    </div>
  )
}

export default withRouter(Demo)
