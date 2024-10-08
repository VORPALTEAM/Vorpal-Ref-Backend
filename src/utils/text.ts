export function notABusyRegex (text: string, regexList: RegExp[]): boolean {
    return regexList.every(regex => !regex.test(text));
}

export function generateRandomString(symbols: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < symbols; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

export function dateSec(): number {
  return Math.round(new Date().getTime() / 1000)
}