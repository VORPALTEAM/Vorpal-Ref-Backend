import { Request, Response } from "express";
import { checkTelegramAuth, decodeTgInitData, validateByInitData } from "../utils/auth";
import { buyItem, getStoreItems, getUserAllItemBalances, getUserItemBalance, isItemAvailableToBuy } from "../models/telegram";

export const getStoreItemsResponce = async (req: Request, res: Response) => {
    const items = await getStoreItems();
    res.status(200).send(JSON.stringify({
        items
    }))
}

export const balanceResponce = async (req: Request, res: Response) => {
    const body = req.body

    if (!body.itemId || !body.login) {
        res.status(400).send("Nessesary parameters missed")
    }

    const balance = await getUserItemBalance (body.login, body.itemId);
    res.status(200).send(JSON.stringify({
        balance: balance || 0
    }))
}

export const balanceAllResponce = async (req: Request, res: Response) => {
    const body = req.body

    if (!body.login) {
        res.status(400).send({ error: "Nessesary parameters missed"})
    }

    const balance = await getUserAllItemBalances (body.login);
    res.status(200).send(JSON.stringify({
        balance: balance || 0
    }))
}

export const checkAvailableResponce = async (req: Request, res: Response) => {
    const body = req.body

    if (!body.itemId || !body.login || !body.amount) {
        res.status(400).send(JSON.stringify({error: "Nessesary parameters missed"}))
    }

    const isAvailable = await isItemAvailableToBuy (body.login, body.itemId, body.amount);
    res.status(200).send(JSON.stringify(isAvailable))
}

export const buyResponce = async (req: Request, res: Response) => {
    const body = req.body;
    console.log("Buy request body: ", req.body);
    if (!body.telegramInitData && !body.telegramData.id) {
        res.status(400).send(JSON.stringify({error: "Auth data wrong or not provided"}))
    }
    if (!body.itemId || !body.amount) {
        res.status(400).send(JSON.stringify({error: "Buying parameters missed"}))
    }
    if (body.amount <= 0) {
        res.status(400).send(JSON.stringify({error: "Invalid amount"}))
    }

    try {
        const telegramDataValidation = 
        body.telegramInitData ? validateByInitData (body.telegramInitData) :
        body.telegramData? checkTelegramAuth(body.telegramData).success : null;
    
        const telegramUserId = String(body.telegramInitData ? decodeTgInitData(body.telegramInitData)?.user?.id: body.telegramData.id)
        
        // const auth = CheckTelegramAuth(body.telegramData);
        // console.log("Auth result on buy: ", auth);
    
        if (!telegramDataValidation || !telegramUserId) {
            res.status(403).send(JSON.stringify({error: "Auth failed"}))
        }
        const buy = await buyItem (telegramUserId, body.itemId, body.amount);
        res.status(200).send(JSON.stringify(buy));
    } catch (e) {
        console.log(e);
        res.status(500).send(JSON.stringify({error: "Server error"}))
    }

}
