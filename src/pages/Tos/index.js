import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './tos.scss';
class Tos extends Component {
  render() {
    return (
      <div className="wrapper">
        <div>
          <p>
            The Vexchange contracts and front-end are open source works that are licensed under GNU. This software is provided without any guarantees or liability, the code and licenses can be reviewed <a href="https://github.com/Monti/vexchange" traget="_blank">here</a>. The Vexchange site is simply an interface to an exchange running on the VeChain blockchain. We do not endorse any of the tokens and are not licensed to give investment advice. You acknowledge that you use this software at your own risk, both in terms of security and financial loss.
          </p>
        </div>
        <Link to="/">
          <button className="tos__cta-btn">Go back</button>
        </Link>
      </div>
    )
  }
}

export default Tos;
