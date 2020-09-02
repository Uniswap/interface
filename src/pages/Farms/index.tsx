import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'
import farmer from '../../assets/img/farmer.png'

import Page from './components/Page'
import PageHeader from './components/PageHeader'

import FarmCards from './components/FarmCards'

const Farms: React.FC = () => {
  const { path } = useRouteMatch()
  return (
    <Switch>
      <Page>
        <>
          <Route exact path={path}>
            <PageHeader
              icon={<img src={farmer} height="96" />}
              subtitle="Earn YAM tokens by providing liquidity."
              title="Select a farm."
            />
            <FarmCards />
          </Route>
        </>
      </Page>
    </Switch>
  )
}

export default Farms
