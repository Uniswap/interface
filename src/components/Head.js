import React from 'react';
import {Helmet} from "react-helmet";

import unicorn from '../images/🦄.png'

function Head(props) {
  return (
    <Helmet>
       <meta charSet="utf-8" />
       <link rel="icon" href={unicorn} sizes="32x32" type="image/png" />
       <title>Uniswap - ERC20 Market Maker</title>
    </Helmet>
  );
}

export default Head;
