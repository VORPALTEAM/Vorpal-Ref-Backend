import { initAdminRoutes } from "./admin";
import { initDefaultRoutes } from "./default";
import { initDuelRoutes } from "./duel";
import { initReferralRoutes } from "./referral";
import { initRewardRoutes } from "./rewards";
import { initStarsRoutes } from "./stars";
import { initStatsRoutes } from "./stats";
import { initStoreRoutes } from "./store";
import { initTelegramRoutes } from "./telegram";

export function initRoutes() {
    initAdminRoutes();
    initDuelRoutes();
    initReferralRoutes();
    initRewardRoutes();
    initStarsRoutes();
    initStatsRoutes();
    initStoreRoutes();
    initTelegramRoutes();
    initDefaultRoutes();
}

  

  