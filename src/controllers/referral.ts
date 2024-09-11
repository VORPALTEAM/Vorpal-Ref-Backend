import { Request, Response } from 'express';
import { withdrawRevenue } from "../models/withdraw";
import { getBalances } from "../models/common";
import { addNewLink, registerReferral, getLinksByOwner, getRefCount } from "../models/links";

export const referralApiDefault = async (req: Request, res: Response) => {

  const postData = req.body;


  if (!postData || !postData.action) {
    res.status(400).send(JSON.stringify({
      error: 'Action is not specified'
    }));
    res.end()
    return;
  }
  
  switch(postData.action) {
     case "CreateLink":
      if (!postData.owner || !postData.reward1 || !postData.reward2) {
        res.status(400).send(JSON.stringify({
          error: 'Some of required params is missing'
        }));
        res.end()
        return;
      }
      res.status(200).send(JSON.stringify({
        creation: "newLink",
        result: await addNewLink(postData.owner, postData.reward1, postData.reward2)
      }));
     break;
     case "RegisterReferral":
      if ( !postData.client || !postData.link ) {
        res.status(400).send(JSON.stringify({
          error: 'Some of required params is missing'
        }));
        res.end()
        return;
      }
      res.status(200).send(JSON.stringify({
        creation: "register",
        result: await registerReferral ( postData.client, postData.link )
      }));
     break;
     case "GetLinksByOwner":
      if ( !postData.owner ) {
        res.status(400).send(JSON.stringify({
          error: 'Some of required params is missing'
        }));
        res.end()
        return;
      }
      res.status(200).send(JSON.stringify({
        creation: "getLinks",
        result: await getLinksByOwner ( postData.owner ),
        warn: "Deprecated. Please request from /api/getlinksbyowner/0x1e... as a get param"
      }));
    break;
     default:
        res.status(200).send(JSON.stringify({
          condition: 'Default'
        }));
        res.end()
     break;
  }
}

export const getLinksByOwnerResponse = async (req: Request, res: Response) => {

  if (!req.params.id) {
    res.status(400).send(JSON.stringify({
      error : "User id is wrong or not specified"
   }));
   return;
  }

  const userId = req.params.id.toLowerCase()
  const links = await getLinksByOwner ( userId )
   res.status(200).send(JSON.stringify({
      links : links
   }));
}

export const getOwnerDataResponse = async (req: Request, res: Response) => {

  if (!req.params.id) {
    res.status(400).send(JSON.stringify({
      error : "User id is wrong or not specified"
   }));
   return;
  }

  const userId = req.params.id.toLowerCase()
  const links = await getLinksByOwner ( userId )
  const balances = await getBalances ( userId )

  let refCount = 0

  for (let v = 0; v < links.length; v++) {
    const response = await getRefCount (links[v].link_key)

    refCount += Number(response[0].count)
  }

   res.status(200).send(JSON.stringify({
      links : links,
      refCount: refCount,
      balanceScheduled: balances.balanceSheduled || 0,
      balanceAvailable: balances.balanceAvailable || 0
   }));
}

export const withdrawRewardAction = async (req: Request, res: Response) => {

  res.setHeader('Access-Control-Request-Headers', 'Content-Type, Accept');
  res.setHeader('Content-Type', 'application/json');

    const postData = req.body;

    if (!postData || !postData.address || !postData.signature) {
      res.status(400).send(JSON.stringify({
        success: false,
        message: 'Post data wrong or not readable'
      }));
      return false
    }
    console.log("Wait for processing")
    const withdrawmsg = await withdrawRevenue(postData.address, postData.signature)

    res.status(withdrawmsg.success ? 200 : 400).send(JSON.stringify(withdrawmsg));
}