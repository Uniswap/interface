import React from 'react';

function Transactions(props) {
  if (props.transactions.length > 0 && props.interaction !== 'disconnected') {
    return (
      <section className="transaction border pa2">
        <p className="underline">Past Transactions:</p>
        <div className="connection">
          <ol>
          {props.transactions.map((t) =>
            <li key={t.toString()}><p><a target="_blank" rel="noopener noreferrer" href={'https://rinkeby.etherscan.io/search?q=' + t}>{t}</a></p></li>
          )}
          </ol>
        </div>
      </section>
    )
  } else {
    return (<section className="hidden border pa2"></section>)
  }
}

export default Transactions;
