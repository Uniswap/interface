import React, { Component } from 'react';
import './Splashscreen.css';

var ModelViewer = require('metamask-logo')

// To render with fixed dimensions:
var viewer = ModelViewer({

  // Dictates whether width & height are px or multiplied
  // pxNotRatio: true,
  // width: 500,
  // height: 400,
  pxNotRatio: false,
  width: 1,
  height: 0.7,

  // To make the face follow the mouse.
  followMouse: true,

  // head should slowly drift (overrides lookAt)
  // slowDrift: true,

})

var metamaskLink = 'https://metamask.io';

class Splashscreen extends Component{

  render() {
    return (
      <div className="install-metamask">
      Uniswap requires MetaMask to connect to the Ethereum blockchain.<br/><br/>
      <a href="https://metamask.io"> {metamaskLink} </a>
      </div>
    );
  }

}

export default Splashscreen;
