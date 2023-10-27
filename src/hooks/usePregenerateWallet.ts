function isValidEmail(email: string): boolean {
  // Regular expression to match a typical email format
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  return emailRegex.test(email)
}

export const pregenerateWallet = async (address: string) => {
  if (!isValidEmail(address)) return ''
  try {
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
    const newWalletAddress = data.linked_accounts.find((account: any) => account.type === 'wallet')?.address
    return newWalletAddress
  } catch (error) {
    console.log(error)
    return ''
  }
}
