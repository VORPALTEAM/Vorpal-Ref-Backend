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

export function dateSecFormat(timeSec: number): string {
  const date = new Date(timeSec * 1000);

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${day}:${month}:${year} ${hours}:${minutes}`;
}

export function formatTime (seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');

  return `${hoursStr}:${minutesStr}:${secsStr}`;
}