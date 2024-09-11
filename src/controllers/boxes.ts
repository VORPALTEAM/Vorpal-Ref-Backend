import { Request, Response } from 'express';
import {
  createNewBox,
  getAvailableBoxesByOwner,
  getBoxOpenResult,
  getBoxOwner,
  getResourceId,
  getUserAssets,
  getUserBalanceRow,
  giveResources,
  openBox,
} from '../models/rewards';
import { getValueByKey } from '../models/common';
import { error } from 'console';
import { checkTelegramAuth, getSignableMessage, validateByInitData } from '../utils/auth';
import Web3 from 'web3';
import { getUserData, getUserWallets } from '../models/user';

const web3 = new Web3(Web3.givenProvider);

let adminWallet = '';

getValueByKey('ADMIN_WALLET').then((value) => {
  adminWallet = value.toLowerCase();
});

/* 
  {
    level: number,
    ownerAddress: string,
    ownerLogin?: string
    signature: string
  }
*/

export const createBox = async (req: Request, res: Response) => {
  const body = req.body;
  if (
    !body.level ||
    !body.ownerAddress ||
    !body.signature
  ) {
    res.status(400).send({
      error: 'Some of nessesary parameters is missing',
    });
  }
  console.log("Box creation request: ", req.body)
  try {
    const msg = getSignableMessage();
    const address = web3.eth.accounts.recover(msg, body.signature)
    .toLowerCase();
    const adminAddress = await getValueByKey("ADMIN_WALLET");
  
    if (address !== adminAddress.toLowerCase()) {
       res.status(403).send({
        error: "Invalid signature",
      });
       return;
    }
  } catch (e) {
    res.status(400).send({ error: "Wrong signature"});
    return;
  }

  try {
    // const isHolderCreated = await CreateNewHolder(body.ownerAddress)
    const boxId = await createNewBox(
      body.level,
      body.ownerAddress.toLowerCase()
    );
    if (!boxId) {
      res.status(400).send({
        error: "Box creation failed"
      })
    }
    res.status(200).send({
      box: boxId,
    });
  } catch (e) {
    res.status(400).send({
      error: String(e.message),
    });
  }
};

export const openBoxRequest = async (req: Request, res: Response) => {
  const body = req.body;

  if (!body.boxId || (!body.signature && !body.telegramData && !body.telegramInitData)) {
    res.status(400).send({
      error: 'Some of nessesary parameters is missing',
    });
  }

  try {
    const msg = getSignableMessage();
    const address = body.signature ? web3.eth.accounts.recover(msg, body.signature)
    .toLowerCase() : "";
    const adminAddress = await getValueByKey("ADMIN_WALLET");
    const boxOwner = await getBoxOwner(body.boxId);

    if (!boxOwner) {
      res.status(400).send({
        error: "Invalid box id",
      });
    }

    const telegramDataValidation = 
    body.telegramInitData ? validateByInitData (body.telegramInitData) :
    body.telegramData? checkTelegramAuth(body.telegramData).success : null;
    const userId = (await getUserData(body.telegramInitData.id || body.telegramData.id, address))?.id;
    if (!userId) {
      res.status(400).send({
        error: "User not found",
      });
      return;
    }
    const ownerWallets = await getUserWallets(userId);
  
    if (address !== adminAddress.toLowerCase() 
      && ownerWallets.indexOf(address) === -1 &&
    !telegramDataValidation) {
      res.status(403).send({
        error: "Caller have no rights to open",
      });
       return;
    }
  } catch (e) {
    res.status(400).send({ error: "Wrong signature"});
    return;
  }

  try {
    const openingResult = await openBox(body.boxId, body.telegramData || undefined);
    res.status(200).send({
      ok: openingResult,
    });
  } catch (e) {
    res.status(400).send({
      error: String(e.message),
    });
  }
};

export const giveResourcesResponse = async (req: Request, res: Response) => {
  const body = req.body;
  if (!body.signature) {
    res.status(400).send({
      error: 'Message must be sgned by admin',
    });
  }
  if (!body.ownerAddress) {
    res.status(400).send({
      error: 'Nessesary user parameters is missing',
    });
  }
  if (!body.resource || !body.amount) {
    res.status(400).send({
      error: 'Resource parameters is missing',
    });
  }
  try {
    const msg = getSignableMessage();
    const address = web3.eth.accounts.recover(msg, body.signature)
    .toLowerCase();
    const adminAddress = await getValueByKey("ADMIN_WALLET");
  
    if (address !== adminAddress.toLowerCase()) {
       res.status(403).send({
        error: "Invalid signature",
      });
       return;
    }
  } catch (e) {
    res.status(400).send({ error: "Wrong signature"});
    return;
  }
  const resourceId = await getResourceId(body.resource);
  if (!resourceId) {
    res.status(400).send({ error: "Resource not found"});
    return;
  }
  const userId = (await getUserData(body.ownerAddress, body.ownerAddress?.toLowerCase()))?.id;
  if (!userId) {
    res.status(400).send({ error: "User not found"});
    return;
  }
  const result = await giveResources(
    userId,
    resourceId,
    body.amount,
  );

  res.status(200).send(result);
};

export const getUserBoxes = async (req: Request, res: Response) => {
  res.send({ ok: 'ok' });
};

export const getUserResources = async (req: Request, res: Response) => {
  const body = req.body;
  if (!body.ownerAddress) {
    res.status(400).send({
      error: 'Nessesary parameters is missing',
    });
    return;
  }
  try {
    const userId = (await getUserData(body.ownerAddress, body.ownerAddress.toLowerCase()))?.id;
    if (!userId) {
      res.status(400).send({
        error: 'User not found',
      });
      return;
    }
    const assets = await getUserAssets(userId)
    res.status(200).send({
      assets: assets,
    });
  } catch (e) {
    res.status(400).send({
      error: String(e.message),
    });
  }
  // res.send({ ok: 'ok' });
};

export const getUserAvailableBoxes = async (req: Request, res: Response) => {
  const body = req.body;
  if (!body.ownerAddress) {
    res.status(400).send({
      error: 'Nessesary parameters is missing',
    });
  }
  const userId = (await getUserData(body.ownerAddress, body.ownerAddress.toLowerCase()))?.id;
  if (!userId) {
    res.status(400).send({
      error: 'User not found',
    });
    return;
  }
  const result = await getAvailableBoxesByOwner (userId);
  res.status(200).send(result)

}

export const getBoxOpenResultResponse = async (req: Request, res: Response) => {
  const body = req.body;

  if (!body.boxId) {
    res.status(400).send({
      error: 'Nessesary parameters is missing',
    });
  }

  const result = await getBoxOpenResult (body.boxId);
  res.status(200).send(result)
}
