import { massRunQueries } from "../connection"

const functionCreationQueries = [ // ToDo: function is invalid
/*  `SELECT add_user ( null, 'admin', 'Vapr', null, 'Yuriy', null, 'berum', 101);

CREATE OR REPLACE FUNCTION add_user (
	referral integer, 
    status user_role_domain, 
    login varchar(32), 
    wallet varchar(128), 
    first_name varchar(64),
    last_name varchar(64),
    username varchar(64),
    tg_chat_id varchar(64)) RETURNS integer AS $$
DECLARE
    val integer;
    new_id integer;
BEGIN	
	SELECT COUNT(*) INTO val FROM users, telegram_personal AS tp, wallets 
    WHERE 
	   (users.id = tp.user_id AND tp.chat_id = tg_chat_id);

    IF val > 0 THEN 
		RETURN NULL;
    END IF;

    IF wallet = NULL AND tg_chat_id = NULL THEN
		RETURN NULL;
    END IF;

    IF referral IS NOT NULL THEN 
		SELECT id INTO val FROM users WHERE id = referral;
        IF NOT FOUND THEN
			RETURN NULL;
        END IF;
     END IF;

     INSERT INTO users (inviter_id, username)
		 VALUES (referral, login) 
		 RETURNING id INTO new_id;

     IF wallet IS NOT NULL THEN
		 INSERT INTO wallets (user_id, wallet_address)
		 VALUES (new_id, wallet);
     END IF;

     IF tg_chat_id IS NOT NULL THEN
		 INSERT INTO telegram_personal (user_id, chat_id, first_name, last_name, username)
		 VALUES (new_id, tg_chat_id, first_name, last_name, username);
     END IF;

	 RETURN new_id;
END;
	$$ LANGUAGE plpgsql;

  ` */
]

export async function createSQLConstraints () {
  return await massRunQueries(functionCreationQueries, true)
}