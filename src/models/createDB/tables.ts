import { massRunQueries } from "../connection"

const userRoles: ('user' | 'moderator' | 'admin')[] = ['user', 'moderator', 'admin']

const tableCreationQueries = [
   `DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_domain') THEN
        CREATE DOMAIN user_role_domain AS VARCHAR(32)
        CHECK (VALUE IN (${userRoles.map(role => `'${role}'`).join(', ')}));
      END IF;
    END $$`,
   `CREATE TABLE IF NOT EXISTS users (
       id SERIAL PRIMARY KEY,
       inviter_id INT,
       username varchar(32),
       role user_role_domain
   );`, // CREATE OR REPLACE, for roles make dictionary
   `CREATE TABLE IF NOT EXISTS "telegram_personal" (
      id serial PRIMARY KEY,
      user_id INT, 
	  first_name varchar(64),
  	  last_name varchar(64),
  	  username varchar(64),
      chat_id varchar(64) NOT NULL UNIQUE
   );`,
   `CREATE TABLE IF NOT EXISTS "erc_wallets" (
      id serial PRIMARY KEY,
      user_id INT,
      wallet_address varchar(128) NOT NULL UNIQUE
   );`,
   `CREATE TABLE IF NOT EXISTS "ton_wallets" (
      id serial PRIMARY KEY,
      user_id INT,
      wallet_address varchar(128) NOT NULL UNIQUE
   )`, // combine, network_family enum('erc', 'ton'), table for dictionary
   `ALTER TABLE "telegram_personal" ADD CONSTRAINT user_id_ref FOREIGN KEY ("user_id") REFERENCES "users" ("id");`,
   `ALTER TABLE "erc_wallets" ADD CONSTRAINT user_id_erc FOREIGN KEY ("user_id") REFERENCES "users" ("id");`,
   `ALTER TABLE "ton_wallets" ADD CONSTRAINT user_id_ton FOREIGN KEY ("user_id") REFERENCES "users" ("id");`
]


export async function createSQLTables () {
      return await massRunQueries(tableCreationQueries, true)
}