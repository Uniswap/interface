import React from 'react';

function NetworkStatus(props) {
  let isConnected = props.connected
  if (isConnected){
    return (
      <div className="connection border pa2">
        <a href={'https://rinkeby.etherscan.io/search?q=' + props.address}>{props.address}</a>
        <p>●</p>
      </div>
    )
  } else {
    return (
      <div className="connection red border pa2">
        <p>{'MetaMask connected to ' + props.network + ' Switch to Rinkeby and refresh!'}</p>
        <p>●</p>
      </div>
    )
  }
}

export default NetworkStatus;
