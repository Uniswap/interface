import React from 'react';
import "./logo.scss";

export default function Logo(props) {
  return (
    <div className="logo">
    <span role="img" aria-label="logo">
     <img src="./images/oasiseth.png" alt="Oasis header logo"></img>
     </span>
    </div>
  );
}
