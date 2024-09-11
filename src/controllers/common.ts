import { Request, Response } from "express";
import { getChannelSubscribeList } from "../telegram/handlers/subscribe";
import { TelegramAuthData } from "../types"
import { checkTelegramAuth, getSignableMessage, validateByInitData, getQueryParam } from "../utils/auth";
import { web3 } from "./duel";
import { getValueByKey } from "../models/common";

export const authByTelegram = (req: Request, res: Response) => {

    const data: TelegramAuthData = req.body;
    res.status(200).send(checkTelegramAuth(data))
}

export const isNeedSubscribes = async (req: Request, res: Response) => {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
        res.status(400).send(JSON.stringify({
            error: "Invalid user id"
        }))
    }
    const subscribes = await getChannelSubscribeList(userId);
    const isSubscribed = (subscribes.length === 0) ? true : false;
    res.status(200).send({
        subscribed: isSubscribed
    })
}

export const universalAuth = async (req: Request, res: Response) => { 
    const body = req.body;
    if (!body.signature && !body.telegramData && !body.telegramInitData) {
        res.status(400).send(JSON.stringify({error: "Auth data wrong or not provided"}))
    }
    if (body.signature) {
        const msg = getSignableMessage();
        const address = body.signature ? web3.eth.accounts.recover(msg, body.signature)
        .toLowerCase() : "";
        return address;
    }

    if (body.telegramInitData) {
        console.log("Validation result: ", validateByInitData (body.telegramInitData))
        console.log("Entered data: ", body.telegramInitData)
        const validationResult = validateByInitData (body.telegramInitData);
        if (!validationResult) {
            return null
        }
        try {
            const userEncoded = getQueryParam('user', body.telegramInitData);
            if (!userEncoded) {
                return null;
            }
            const userDecoded = decodeURIComponent(userEncoded);
            const parsedData = JSON.parse(userDecoded);
            console.log("Parsed: ", parsedData);
            return parsedData
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    if (body.telegramData) {
       return checkTelegramAuth(body.telegramData).success ? body.telegramData.id : null
    }
}

export const isAdminBySignature = async (signature: string) => {
    try {
        const msg = getSignableMessage();
        const address = web3.eth.accounts.recover(msg, signature)
        .toLowerCase();
        const adminAddress = await getValueByKey("ADMIN_WALLET");
      
        if (address !== adminAddress.toLowerCase()) {
           return false;
        }
        return true
      } catch (e: any) {
        console.log(e)
        return false;
      }
}