import React, { Component } from 'react';
import { connect } from 'react-redux';

import AboutMessage from './AboutMessage';

class About extends Component {
  render () {
    return(
      <div>  
        <section className="About" ref={(section) => { this.props.location.About = section; }}>
            <a onClick={() => {this.props.toggleAbout()}} className="link border pa2 f-a">
            <p className="underline">About Uniswap.</p>
            <p>↘</p>
            </a>
        </section>
        <AboutMessage toggled={this.props.web3Store.aboutToggle} />
      </div>
    ) 
  }
}

const mapStateToProps = state => ({
  web3Store: state.web3Store
});

export default connect (mapStateToProps)(About)