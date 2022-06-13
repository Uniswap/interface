import React from 'react';
import {Redirect, Switch, Route } from 'react-router';

export default (
  <Switch>
    <Route path="/swap"  />
    <Route path="/swap/:outputCurrency" />
    <Route path="/find"  />
    <Route path="/pools"  />
    <Route path="/pools/:currencyIdA"  />
    <Route path="/pools/:currencyIdA/:currencyIdB"  />
    <Route path="/farms"  />
    <Route path="/myPools"  />
    <Route path="/create"  />
    <Route path="/create/:currencyIdA"  />
    <Route
    path="/create/:currencyIdA/:currencyIdB"
    />
    <Route path="/add/:currencyIdA/:currencyIdB/:pairAddress" />
    <Route
    path="/remove/:currencyIdA/:currencyIdB/:pairAddress"
    />
    <Route path="/about/kyberswap" />
    <Route path="/about/knc" />
    <Route path="/referral" />
    <Route path="/discover" />
    <Redirect to='/swap'/>
 </Switch>
)
