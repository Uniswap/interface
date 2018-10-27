import React, { Component } from 'react';
import Header from '../../components/Header';
import AddLiquidity from './AddLiquidity';
import CreateExchange from './CreateExchange';
import { Switch, Redirect, Route } from 'react-router-dom';
import "./pool.scss";
import Swap from "../Swap";
import Send from "../Send";
import {AnimatedSwitch} from "react-router-transition";

const ADD_LIQUIDITY = 'Add Liquidity';
const REMOVE_LIQUIDITY = 'Remove Liquidity';
const CREATE_EXCHANGE = 'Create Exchange';

class Pool extends Component {
  state = {
    selectedMode: ADD_LIQUIDITY,
  };

  render() {
    return (
      <div className="pool">
        <Header />
        <Switch>
          <Route exact path="/pool/add" component={AddLiquidity} />
          {/*<Route exact path="/remove" component={Send} />*/}
          <Route exact path="/pool/create" component={CreateExchange} />
          <Redirect exact from="/pool" to="/pool/add" />
        </Switch>
      </div>
    );
  }
}

export default Pool;
