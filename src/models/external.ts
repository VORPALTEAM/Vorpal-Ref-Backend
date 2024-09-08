import superagent from 'superagent';
import { getSignableMessage } from '../utils/auth';
import { web3 } from '../controllers';
import { getValueByKey } from './balances';

export async function notifyDuelFinishFor(login: string, duelId: string) {
  const key = (await getValueByKey('ADMIN_KEY')) || '';
  const signature = web3.eth.accounts.sign(getSignableMessage(), key).signature;
  const url = `${process.env.BATTLE_SERVER_HOST}/api/duelcancel`;
  try {
    const Response =  await superagent.post(url)
    .send({
      signature,
      login,
      duelId
    }).set('Accept', 'application/json')
    .set('Content-Type', 'application/json') 
    .then(response => {
      console.log(response.body); // обработка успешного ответа
      return Response.status === 200 ? true : false;
    })
    .catch(error => {
      console.error('Error:', error); // обработка ошибки
      return false;
    });
    console.log('Result: ', url, Response.status);
    return Response;
  } catch (e) {
    console.log(e.message);
    return false;
  }
}
