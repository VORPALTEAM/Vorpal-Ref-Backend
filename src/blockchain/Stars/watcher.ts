import { contractWatchingTimeout } from "../../blockchain/config";
import { StarData, StarList } from "../../types";
import { GetAllStarData, GetSingleStarData } from "./getter";
import { writeLog } from "../../models/log";

export let actualStarList: StarList = [];
export let lastUpdateRequqstTime = 0;
let watchingTimer;

export function updateLastTime (time: number) {
    lastUpdateRequqstTime = time;
}

export async function updateStars() {
    try {
        const stars = await GetAllStarData();
        if (stars) {
          actualStarList = stars;
        }
     } catch (e) {
      writeLog("Failed to load stars", e.message);
     }
}

export async function updateSingleStar (starId: number) {
    try {
        const newdata = await GetSingleStarData(starId);
        if (newdata) {
          const newstarList: StarList = [];
          for (let j = 0; j < actualStarList.length; j++) {
            if (j !== starId) {
                newstarList.push(actualStarList[j])
            } else {
                newstarList.push(newdata)
            }
          }
          actualStarList = [...newstarList];
        }
     } catch (e) {
      writeLog("Failed to load stars", e.message);
     }
}

export function startWatchingTimer () {
    GetAllStarData().then((res) => {
        actualStarList = res
        // console.log(actualStarList)
    }).catch(e => {
        console.log(e)
    }) ;
    watchingTimer = setInterval(async () => {
        updateStars()
    }, contractWatchingTimeout)
}

export function StopWatchingTimer () {
    if (watchingTimer) {
        clearInterval(watchingTimer);
    }
}