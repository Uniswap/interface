import React from 'react'
import { withRouter } from 'react-router'
import Button from '../components/Button'

function Migrate() {
  return (
    <div style={{ paddingTop: '10px', display: 'grid', gridRowGap: '60px', gridTemplateRows: 'auto' }}>
      <Button small={false} success={true} disabled={false}>
        Button
      </Button>
      <Button small={true} success={false} disabled={false}>
        Button
      </Button>
    </div>
  )
}

export default withRouter(Migrate)
