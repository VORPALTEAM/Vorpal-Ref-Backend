import { massRunQueries } from "../connection"

const userRoles: ('user' | 'moderator' | 'admin')[] = ['user', 'moderator', 'admin']

const tableCreationQueries = [
   /* `DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_domain') THEN
        CREATE DOMAIN user_role_domain AS VARCHAR(32)
        CHECK (VALUE IN (${userRoles.map(role => `'${role}'`).join(', ')}));
      END IF;
    END $$`, */
   `CREATE TABLE IF NOT EXISTS users (
       id SERIAL PRIMARY KEY,
       inviter_id Int,
       username varchar(32),
       role_id Int
   );`, // for roles make dictionary
   `CREATE TABLE IF NOT EXISTS "telegram_personal" (
      id serial PRIMARY KEY,
      user_id INT, 
	  first_name varchar(64),
  	  last_name varchar(64),
  	  username varchar(64),
      chat_id varchar(64) NOT NULL UNIQUE
   );`,
   `CREATE TABLE IF NOT EXISTS "wallets" (
      id serial PRIMARY KEY,
      user_id Int,
      wallet_address varchar(128) NOT NULL UNIQUE,
      network_family_id Int
   );`,
   `CREATE TABLE IF NOT EXISTS "network_families" (
      id serial PRIMARY KEY,
      name varchar(32) NOT NULL UNIQUE
   );`, 
   `CREATE TABLE IF NOT EXISTS "roles" (
      id serial PRIMARY KEY,
      name varchar(32) NOT NULL UNIQUE
   );`,
   `CREATE TABLE IF NOT EXISTS "languages" (
      id serial PRIMARY KEY,
      short_name varchar(8) NOT NULL UNIQUE,
      name varchar(16) NOT NULL UNIQUE
   );`,
   `CREATE TABLE IF NOT EXISTS "quests" (
      id serial PRIMARY KEY,
      title varchar(64),
      description varchar(512),
      date_start DATE,
      date_end DATE,
      status varchar(16)
   );`,
   `CREATE TABLE IF NOT EXISTS "user_quest_status" (
      id serial PRIMARY KEY,
      user_id integer,
      quest_id integer,
      date_completed DATE,
      completed BOOLEAN
   );`,
   `CREATE TABLE IF NOT EXISTS "watching_tg_subscriptions" (
     id serial PRIMARY KEY,
	  channel_name varchar(128),
	  channel_username varchar(128),
	  channel_id varchar(128),
     language_id integer
    );`,
    `CREATE TABLE IF NOT EXISTS "watching_tg_subscriptions" (
     id serial PRIMARY KEY,
	  channel_name varchar(128),
	  channel_username varchar(128),
	  channel_id varchar(128),
     language_id integer
    );`,
    `CREATE TABLE IF NOT EXISTS "user_stats" (
     id serial PRIMARY KEY,
	  user_id integer,
     age integer,
     games integer,
     wins integer
    );`,
    `CREATE TABLE IF NOT EXISTS "user_last_daily_reward" (
     id serial PRIMARY KEY,
     user_id integer,
     last_reward_timestamp integer
    );`,
    `CREATE TABLE IF NOT EXISTS "referral_stats" (
     id serial PRIMARY KEY,
     recipient_id integer,
     referrer_id integer,
     resource_id integer,
     amount integer,
     reward_date integer,
     level integer
    );`,
    `CREATE TABLE IF NOT EXISTS "item_txn_log" (
     id serial PRIMARY KEY,
     item_id integer,
     from_id integer,
     to_id integer,
     date integer,
     amount integer
    );`,
    `CREATE TABLE IF NOT EXISTS "store" (
     id serial PRIMARY KEY,
     item_id integer,
     currency_id integer,
     price integer,
     user_balance_limit integer,
     available_count integer
    );`,
    `CREATE TABLE IF NOT EXISTS "user_balances" (
     id serial PRIMARY KEY,
     user_id integer,
     item_id integer,
     amount integer,
     UNIQUE (user_id, item_id)
    );`,
    `CREATE TABLE IF NOT EXISTS "stars" (
     id serial PRIMARY KEY,
     owner_id integer,
     name varchar(64),
     creation integer,
     updated integer,
     level integer,
     fuel integer,
     level_up_fuel integer,
     habitable_zone_min integer,
     habitable_zone_max integer,
     planet_slots integer,
     mass integer,
     coords INTEGER[3],
     race VARCHAR(8)
    );`,
    `CREATE TABLE IF NOT EXISTS "vestings" (
     id serial PRIMARY KEY,
     user_id integer,
     item_id integer,
     date_start integer,
     date_updated integer,
     date_end integer,
     total_count integer,
     paid integer
    );`,
    `CREATE TABLE IF NOT EXISTS "items" (
     id serial PRIMARY KEY,
     name varchar(32) NOT NULL UNIQUE,
     total_count integer,
     img_preview varchar(256),
     img_full varchar(256),
     type varchar(32), 
     rareness varchar(32), 
     description varchar(128)
    );`,
    `CREATE TABLE IF NOT EXISTS "boxes" (
     id serial PRIMARY KEY,
     owner_id integer,
     level integer,
     is_open boolean
    );`,
    `CREATE TABLE IF NOT EXISTS "games" (
     id serial PRIMARY KEY,
     star_id integer,
     name varchar(64),
     description varchar(256),
     picture varchar(256),
     url varchar(256)
    );`,
    `CREATE TABLE IF NOT EXISTS "duels" (
     id serial PRIMARY KEY,
     user_1_id integer,
     user_2_id integer,
     creation integer,
     winner_id integer,
     is_started integer,
     is_finished integer
    );`,
    `CREATE TABLE IF NOT EXISTS "box_open_results" (
     id serial PRIMARY KEY,
     box_id integer,
     resource_ids integer[],
     amounts integer[]
    );`,
    `CREATE TABLE IF NOT EXISTS "duel_stats" (
     id serial PRIMARY KEY,
     duel_id integer,
     user_id integer,
     damage_total integer,
     experience integer,
     gold integer
    );`,
    `CREATE TABLE IF NOT EXISTS common_data (
      id SERIAL PRIMARY KEY,
      key varchar(512) NOT NULL UNIQUE,
      value TEXT 
    );`
   /* `ALTER TABLE "telegram_personal" ADD CONSTRAINT user_id_ref FOREIGN KEY ("user_id") REFERENCES "users" ("id");`,
   `ALTER TABLE "wallets" ADD CONSTRAINT user_id_wallet FOREIGN KEY ("user_id") REFERENCES "users" ("id");`,
   `ALTER TABLE "wallets" ADD CONSTRAINT nf_id FOREIGN KEY ("network_family_id") REFERENCES "network_families" ("id");`,
   `ALTER TABLE "users" ADD CONSTRAINT role_user_id FOREIGN KEY ("role_id") REFERENCES "roles" ("id");` */
]


export async function createSQLTables () {
      return await massRunQueries(tableCreationQueries, true)
}