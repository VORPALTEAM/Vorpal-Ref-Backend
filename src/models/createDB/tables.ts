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
   );`, // combine, network_family enum('erc', 'ton'), table for dictionary
   `CREATE TABLE IF NOT EXISTS "roles" (
      id serial PRIMARY KEY,
      name varchar(32) NOT NULL UNIQUE
   );`,
   `CREATE TABLE IF NOT EXISTS "languages" (
      id serial PRIMARY KEY,
      short_name varchar(8) NOT NULL UNIQUE,
      name varchar(16) NOT NULL UNIQUE
   );`,
   `CREATE TABLE IF NOT EXISTS "watching_tg_subscriptions" (
     id serial PRIMARY KEY,
	  channel_name varchar(128),
	  channel_username varchar(128),
	  channel_id varchar(128),
     language_id integer
    );`,
   `ALTER TABLE "telegram_personal" ADD CONSTRAINT user_id_ref FOREIGN KEY ("user_id") REFERENCES "users" ("id");`,
   `ALTER TABLE "wallets" ADD CONSTRAINT user_id_wallet FOREIGN KEY ("user_id") REFERENCES "users" ("id");`,
   `ALTER TABLE "wallets" ADD CONSTRAINT nf_id FOREIGN KEY ("network_family_id") REFERENCES "network_families" ("id");`,
   `ALTER TABLE "users" ADD CONSTRAINT role_user_id FOREIGN KEY ("role_id") REFERENCES "roles" ("id");`
]


export async function createSQLTables () {
      return await massRunQueries(tableCreationQueries, true)
}