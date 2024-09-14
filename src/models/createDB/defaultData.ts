import { massRunQueries } from "../connection"

const defaultDataSetupQueries = [
`  -- Insert languages
INSERT INTO "languages" (short_name, name) VALUES ('ru', 'Русский'), ('en', 'English');`,
`-- Insert roles
INSERT INTO "roles" (name) VALUES ('user'), ('admin');`,
`-- Insert network families
INSERT INTO "network_families" (name) VALUES ('TON'), ('EVM');`,
`-- Default resources
INSERT INTO "items" (
	name, total_count, img_preview, img_full, type, rareness, description)
	VALUES 
    ('VRP', null, '/gui/images/icons/coins.png', '/gui/images/icons/coins.png', 'currency', null, ''),
    ('spores', null, '/gui/images/icons/spores.png', '/gui/images/icons/spores.png', 'currency', null, ''),
    ('spice', null, '/gui/images/icons/spice.png', '/gui/images/icons/spice.png', 'currency', null, ''),
    ('metal', null, '/gui/images/icons/metal.png', '/gui/images/icons/metal.png', 'currency', null, ''),
    ('biomass', null, '/gui/images/icons/biomass.png', '/gui/images/icons/biomass.png', 'currency', null, ''),
    ('carbon', null, '/gui/images/icons/carbon.png', '/gui/images/icons/carbon.png', 'currency', null, ''),
    ('trends', null, '/gui/images/icons/trends.png', '/gui/images/icons/trends.png', 'currency', null, ''),
    ('laser1', null, '/gui/images/icons/laser-red.png', '/gui/images/icons/laser-red.png', 'laser', 'usual', ''),
    ('laser2', null, '/gui/images/icons/laser-white.png', '/gui/images/icons/laser-white.png', 'laser', 'rare', ''),
    ('laser3', null, '/gui/images/icons/laser-violet.png', '/gui/images/icons/laser-violet.png', 'laser', 'relict', ''); 
`,`
INSERT INTO public.store(
	item_id, currency_id, price, user_balance_limit, available_count)
	VALUES 
    (8, 1, 1, null, null), 
    (9, 1, 2, 1, 10),
    (10, 1, 3, 1, 3);
`

];

export async function defaultDataSetup() {

}