import React from 'react'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

import Web3ReactManager from '../components/Web3ReactManager'
import Header from '../components/Header'
import NavigationTabs from '../components/NavigationTabs'
import Swap from './Swap'
import Send from './Send'
import Pool from './Pool'

import './App.scss'

export default function App() {
  return (
    <div id="app-container">
      <Header />
      <div className="app__wrapper">
        <div className="body">
          <div className="body__content">
            <Web3ReactManager>
              <BrowserRouter>
                <NavigationTabs />
                <Switch>
                  <Route exact strict path="/swap" component={Swap} />
                  <Route exact strict path="/send" component={Send} />
                  <Route
                    path={[
                      '/add-liquidity',
                      '/remove-liquidity',
                      '/create-exchange',
                      '/create-exchange/:tokenAddress?'
                    ]}
                    component={Pool}
                  />
                  <Redirect to="/swap" />
                </Switch>
              </BrowserRouter>
            </Web3ReactManager>
          </div>
        </div>
      </div>
    </div>
  )
}
