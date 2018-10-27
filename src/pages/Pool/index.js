import React, { Component } from 'react';
import Header from '../../components/Header';
import AddLiquidity from './AddLiquidity';
import CreateExchange from './CreateExchange';
import { Switch, Redirect, Route } from 'react-router-dom';
import "./pool.scss";
import MediaQuery from "react-responsive";


class Pool extends Component {
  render() {
    return (
      <div className="pool">
        <MediaQuery query="(max-device-width: 768px)">
          <Header />
        </MediaQuery>
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
