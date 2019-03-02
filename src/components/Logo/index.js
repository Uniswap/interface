import React from 'react';
import "./logo.scss";
import dalecoinLogo from '../../assets/images/dalecoin_logo.jpeg';

export default function Logo(props) {
  return (
    <div className="logo">
      <span role="img" aria-label="logo"><img style={{ width: '50px' }} src={dalecoinLogo} /></span>
    </div>
  );
}
