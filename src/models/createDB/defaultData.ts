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
	name, total_count, img_preview, img_full)
	VALUES 
    ('tVRP', null, '/gui/images/icons/coins.png', '/gui/images/icons/coins.png'),
    ('spores', null, '/gui/images/icons/spores.png', '/gui/images/icons/spores.png'),
    ('spice', null, '/gui/images/icons/spice.png', '/gui/images/icons/spice.png'),
    ('metal', null, '/gui/images/icons/metal.png', '/gui/images/icons/metal.png'),
    ('biomass', null, '/gui/images/icons/biomass.png', '/gui/images/icons/biomass.png'),
    ('carbon', null, '/gui/images/icons/carbon.png', '/gui/images/icons/carbon.png'),
    ('trends', null, '/gui/images/icons/trends.png', '/gui/images/icons/trends.png'); 
`

];

export async function defaultDataSetup() {

}