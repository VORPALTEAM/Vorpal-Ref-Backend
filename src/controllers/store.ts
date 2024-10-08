import { Request, Response } from "express";
import { checkTelegramAuth, decodeTgInitData, validateByInitData } from "../utils/auth";
import { buyItem, getStoreItems, getUserAllItemBalances, getUserItemBalance, isItemAvailableToBuy } from "../models/store";
import { getUserId } from "../models/user";

export const getStoreItemsResponse = async (req: Request, res: Response) => {
    const items = await getStoreItems();
    res.status(200).send(JSON.stringify({
        items
    }))
}

export const balanceResponse = async (req: Request, res: Response) => {
    const body = req.body

    if (!body.itemId || !body.login) {
        res.status(400).send("Nessesary parameters missed");
        return;
    }
    const user = await getUserId(body.login, body.login?.toLowerCase());
    if (!user) {
        res.status(400).send("User not found");
        return;
    }
    const balance = await getUserItemBalance (user, body.itemId);
    res.status(200).send(JSON.stringify({
        balance: balance || 0
    }))
}

export const balanceAllResponse = async (req: Request, res: Response) => {
    const body = req.body

    if (!body.login) {
        res.status(400).send({ error: "Nessesary parameters missed"})
    }
    const user  = await getUserId(body.login, body.login.toLowerCase());
    if (!user) {
        res.status(200).send(JSON.stringify({
            balance: null,
            error: "User not found"
        }));
        return;
    }
    const balance = await getUserAllItemBalances (user);
    res.status(200).send(JSON.stringify({
        balance
    }))
}

export const checkAvailableResponse = async (req: Request, res: Response) => {
    const body = req.body

    if (!body.itemId || !body.login || !body.amount) {
        res.status(400).send(JSON.stringify({error: "Nessesary parameters missed"}));
        return;
    }
    const user  = await getUserId(body.login, body.login.toLowerCase());
    if (!user) {
        res.status(400).send(JSON.stringify({
            error: "User not found"
        }));
        return;
    }
    const isAvailable = await isItemAvailableToBuy (user, body.itemId, body.amount);
    res.status(200).send(JSON.stringify(isAvailable))
}

export const buyResponse = async (req: Request, res: Response) => {
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
        const userId = await getUserId(telegramUserId);
        if (!userId) {
            res.status(403).send(JSON.stringify({error: "Auth failed"}))
            return;
        }
        /* const isAvailable = await isItemAvailableToBuy(userId, body.itemId, body.amount);
        if (!isAvailable.ok) {
            res.status(403).send(JSON.stringify({error: isAvailable.error}))
            return;
        } */
        const buy = await buyItem (userId, body.itemId, body.amount);
        res.status(200).send(JSON.stringify(buy));
    } catch (e) {
        console.log(e);
        res.status(500).send(JSON.stringify({error: "Server error"}))
    }

}
