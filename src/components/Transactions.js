import React from 'react';

function Transactions(props) {
  return (
    <div className="connection">
      <ol>
      {props.transactions.map((t) =>
        <li key={t.toString()}><p><a href={'https://rinkeby.etherscan.io/search?q=' + t}>{t}</a></p></li>
      )}
      </ol>
    </div>
  )
}

export default Transactions;
