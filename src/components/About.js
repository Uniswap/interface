import React, { Component } from 'react';
import AboutMessage from './AboutMessage';
import scrollToComponent from 'react-scroll-to-component';

export default class About extends Component {
  constructor (props) {
    super(props)
    this.state = { toggled: false }
  }

  toggleAbout = () => {
    this.setState({toggled: !this.state.toggled})
    setTimeout(this.scrollToAbout, 300);
  }

  scrollToAbout = () => {
    scrollToComponent(this.About, { offset: 0, align: 'top', duration: 500})
  }

  render () {
    const { toggled } = this.state;
    return(
      <div>  
        <section className="About" ref={(section) => { this.About = section; }}>
            <a onClick={() => {this.toggleAbout()}} className="link border pa2 f-a">
            <p className="underline">About Uniswap.</p>
            <p>↘</p>
            </a>
        </section>
        <AboutMessage toggled={toggled} />
      </div>
    ) 
  }
}
