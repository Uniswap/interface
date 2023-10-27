export const pregenerateWallet = async (address: string) => {
  const res = await fetch('https://auth.privy.io/api/v1/users', {
    method: 'POST',
    headers: {
      'privy-app-id': process.env.REACT_APP_PRIVY_APP_ID ?? '',
      'privy-app-secret': process.env.REACT_APP_PRIVY_SECRET ?? '',
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(process.env.REACT_APP_PRIVY_APP_ID + ':' + process.env.REACT_APP_PRIVY_SECRET),
    },
    body: JSON.stringify({
      create_embedded_wallet: true,
      linked_accounts: [
        {
          address,
          type: 'email',
        },
      ],
    }),
  })
  const data = await res.json()
  return data
}
