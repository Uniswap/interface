import React from 'react';
import "./logo.scss";
import dalecoinLogo from '../../assets/images/dalecoin_logo.png';

export default function Logo(props) {
  return (
    <div className="logo">
      <span role="img" aria-label="logo"><img style={{ width: '70px' }} src={dalecoinLogo} /></span>
    </div>
  );
}
