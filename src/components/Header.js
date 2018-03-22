import React from 'react';
import NetworkStatus from '../components/NetworkStatus';

function Header (props){
  return (
  <section className="title">
    <div className="logo border pa2">
      <span role="img" aria-label="Unicorn">🦄</span>
    </div>
    <NetworkStatus metamask={props.metamask}/>
  </section>
  )
}

export default Header;