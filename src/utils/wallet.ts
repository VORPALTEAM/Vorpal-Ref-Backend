export function generateWalletShortedName (wallet: string) {

  if (wallet.length <= 6) {
    return wallet; 
  }

  const startLength = 4;
  const endLength = 4;

  const start = wallet.slice(0, startLength);
  const end = wallet.slice(-endLength);

  return `${start}...${end}`;
}