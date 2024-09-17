import { Request, Response } from "express";
import { timeUpdateRequestLimit } from "../blockchain/config";
import { actualStarList, lastUpdateRequqstTime, updateLastTime, updateSingleStar, updateStars } from "../blockchain/Stars/watcher";
import { getAllStarsWeb2, Star } from "../models/stars";

export const getAllStars = (req: Request, res: Response) => {
    res.status(200).send(actualStarList); // actualStarList
 }

export const updateAllStars = async (req: Request, res: Response) => {
    const date = new Date().getTime();
    const timePast = date - lastUpdateRequqstTime;
    if (timePast > timeUpdateRequestLimit) {
      updateLastTime(date);
      await updateStars();
      res.status(200).send({success: true, message: 'Star update requested'});
    } else {
      res.status(200).send({success: false, message: 'Too small request interval'}); // actualStarList
    }
  }

export const updateOneStar = async (req: Request, res: Response) => {
  const date = new Date().getTime();
  const timePast = date - lastUpdateRequqstTime;
  try {
    if (timePast > timeUpdateRequestLimit) {
      const starId = Number(req.params.id);
      if (starId > 0 && starId < actualStarList.length) {
        updateLastTime(date);
        await updateSingleStar(Math.ceil(starId));
        res.status(200).send({success: true, message: 'Star update requested'});
      } else {
        res.status(400).send({success: false, message: 'Wrong star id'});
      }
    } else {
      res.status(200).send({success: false, message: 'Too small request interval'}); // actualStarList
    }
  } catch (e) {
    res.status(400).send({success: false, message: 'Error in processing : ' + e.message});
  }
}

export const getWeb2StarList = async (req: Request, res: Response) => {
  try {
    const stars: Star[] = await getAllStarsWeb2() || [];
    res.status(200).send(stars)
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: 'Server error' });
  }
}