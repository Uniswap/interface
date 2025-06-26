// TokenBalancesCard.jsx
import { useState } from 'react'

const rows = [
  {
    symbol: 'ETH',
    balance: '6.82K',
    price: '$0.0258',
    value: '$18.452',
    icon: '/icons/eth.svg', // replace with real paths
  },
  {
    symbol: 'ALPACA',
    balance: '52.82K',
    price: '$5.26',
    value: '$14.650',
    icon: '/icons/alpaca.svg',
  },
  {
    symbol: 'SUI',
    balance: '356.58',
    price: '$0.0058',
    value: '$3.54',
    icon: '/icons/sui.svg',
  },
  {
    symbol: 'TRX',
    balance: '548.0',
    price: '$0.0215',
    value: '$0.452',
    icon: '/icons/trx.svg',
  },
  {
    symbol: 'WIF',
    balance: '485.05',
    price: '$0.0288',
    value: '$1.452',
    icon: '/icons/wif.svg',
  },
]

export default function TokenBalancesCard() {
  const [suspicious, setSuspicious] = useState(false)

  return (
    <>
      {/* ----------  LOCAL CSS  ---------- */}
      <style>{`
        /* --- wrapper & neon border --------------------------------------------------- */
        .tb-wrapper {
          position: relative;     /* tweak as needed */
          margin: 0 auto;
          border-radius: 12px;         /* same 12 px corner radius */

  /* dark “glass” background (80 % opacity) */
  background: rgba(5, 5, 18, 0.8);

  /* the magic ✨ – two inset box-shadows to mimic the cyan rim + soft glow */
  box-shadow:
    inset 0 0 0 1px rgba(0, 255, 233, 0.30),   /* crisp inner stroke */
    inset 0 4px 34px rgba(0, 255, 233, 0.40);  /* blurred neon bloom */

  /* adds the subtle frosted-glass blur visible behind the card */
  backdrop-filter: blur(40px);
        }

        /* --- card body --------------------------------------------------------------- */
        .tb-card {
          position: relative;
          padding: 32px;
          border-radius: 16px;
          color: #fff;
          font-family: system-ui, sans-serif;
        }

        /* --- header: title + buttons ------------------------------------------------- */
        .tb-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .tb-title {
          font-size: 1.125rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tb-btn, .tb-btn-icon {
          background: transparent;
          border: none;
          color: #fff;
          cursor: pointer;
        }
        .tb-btn-icon:hover,
        .tb-btn:hover {
          background: rgba(255,255,255,.1);
        }
        .tb-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: .75rem;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .tb-btn-icon {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* --- toggle ------------------------------------------------------------------ */
        .tb-toggle {
          position: relative;
          width: 40px;
          height: 20px;
          border-radius: 20px;
          background: rgba(110,110,110,.5);
          cursor: pointer;
          transition: background .25s;
        }
        .tb-toggle[data-on="true"] { background: rgba(0,255,233,.6); }
        .tb-toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          transition: transform .25s;
        }
        .tb-toggle[data-on="true"]::after { transform: translateX(20px); }

        /* --- table ------------------------------------------------------------------- */
        .tb-table {
          width: 100%;
          border-collapse: collapse;
          font-size: .875rem;
        }
        .tb-table th {
          text-align: left;
          font-weight: 500;
          padding-bottom: 12px;
          color: rgba(0,255,233,.8);
        }
        .tb-table td {
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .tb-table tr:last-child td { border-bottom: none; }
        .tb-token {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tb-token img { width: 16px; height: 16px; }
        .tb-row:hover { background: rgba(255,255,255,.05); }
      `}</style>

      {/* ----------  COMPONENT MARKUP  ---------- */}
      <div className="tb-wrapper">
        <div className="tb-card">
          {/* header */}
          <div className="tb-header">
            <div className="tb-title">
              Token Balances
              <button className="tb-btn-icon">+</button>
              <button className="tb-btn">Filter</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* simple toggle */}
              <div className="tb-toggle" data-on={suspicious} onClick={() => setSuspicious(!suspicious)} />
              <span style={{ fontSize: '0.75rem', color: '#00ffe9' }}>Suspicious Filters</span>
              <button className="tb-btn-icon">star</button>
            </div>
          </div>

          {/* table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="tb-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Balance</th>
                  <th>Price</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.symbol} className="tb-row">
                    <td>
                      <div className="tb-token">
                        <img src={row.icon} alt={row.symbol} />
                        {row.symbol}
                      </div>
                    </td>
                    <td>{row.balance}</td>
                    <td>{row.price}</td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
