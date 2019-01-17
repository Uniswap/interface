import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withNamespaces } from 'react-i18next';
import PropTypes from 'prop-types';

import './footer.scss';

class Footer extends Component {
  render() {
    return (
      <footer className="footer">
        <div className="footer__wrapper">
          <Link to="/terms-of-service">Terms of Service</Link>
        </div>
      </footer>
    )
  }
}

export default withNamespaces()(Footer);
