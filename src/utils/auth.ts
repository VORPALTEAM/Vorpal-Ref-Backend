import crypto from 'crypto';
import { TelegramAuthData, TelegramAuthDataNoHash, TGInitData } from '../types';

const token = process.env.TELEGRAM_API_TOKEN || '';

export function getDaylyAuthDate(): number {
  const dt = new Date().getTime();
  return Math.round((dt - (dt % 86400000)) / 1000);
}

export function getSignableMessage(): string {
  const dt = new Date().getTime();
  return 'auth_' + String(dt - (dt % 600000));
}

export function getQueryParam(param, url) {
  const urlParams = new URLSearchParams(url);
  return urlParams.get(param);
}

export function createTelegramAuthHash(auth_data: TelegramAuthDataNoHash) {
  // Sorting the restData keys alphabetically
  const data_check_arr = Object.entries(auth_data)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([key, value]) => `${key}=${value}`);

  const data_check_string = data_check_arr.join('\n');

  const secret_key = crypto
    .createHash('sha256')
    .update(process.env.TELEGRAM_API_TOKEN as string)
    .digest();

  const hashResult = crypto
    .createHmac('sha256', secret_key)
    .update(data_check_string)
    .digest('hex');

  return hashResult;
}

/* : {
  success: boolean;
  error: string;
}
  */
// Data from url params
export function checkTelegramAuth(params: TelegramAuthData): {
  success: boolean;
  error: string;
} {
  const dt: number = new Date().getTime();
  if (dt - Number(params.auth_date) * 1000 > 86400000) {
    // milisecond
    console.log('Data is outdated: ', params.auth_date);
    return {
      success: false,
      error: 'Data is outdated',
    };
  }

  console.log("Received params: ", params);

  const verificationParams: any = { ...params };
  delete verificationParams.hash;
  const sortedKeys = Object.keys(verificationParams).sort();
  const message = sortedKeys
    .map((key) => `${key}=${verificationParams[key]}`)
    .join('\n');
  console.log("Formatted data: ", message);
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
  console.log('Hashes: ', hash, params.hash);
  if (hash !== params.hash) {
    console.log('Hash comparision failed!');
    return {
      success: false,
      error: 'Invalid hash',
    };
  }
  return {
    success: true,
    error: '',
  };
}
// Telegram webApp init data
export function validateByInitData (initData: any, botToken = token) {
  const urlSearchParams = new URLSearchParams(initData);
  const data = Object.fromEntries(urlSearchParams.entries());

  const checkString = Object.keys(data)
    .filter(key => key !== 'hash')
    .map(key => `${key}=${data[key]}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
 
  const signature = crypto.createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');
 
  return data.hash === signature;
}

export function decodeTgInitData(urlParams: string): TGInitData {
    let params = new URLSearchParams(urlParams);
    let result: any = {};
    for (let [key, value] of params.entries()) {
        try {
            result[key] = JSON.parse(decodeURIComponent(value));
        } catch (e) {
            result[key] = decodeURIComponent(value);
        }
    }
    return result;
}
