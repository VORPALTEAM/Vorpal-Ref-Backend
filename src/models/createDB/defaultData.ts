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
    ('spore', null, '/gui/images/icons/spores.png', '/gui/images/icons/spores.png', 'currency', null, ''),
    ('spice', null, '/gui/images/icons/spice.png', '/gui/images/icons/spice.png', 'currency', null, ''),
    ('metal', null, '/gui/images/icons/metal.png', '/gui/images/icons/metal.png', 'currency', null, ''),
    ('biomass', null, '/gui/images/icons/biomass.png', '/gui/images/icons/biomass.png', 'currency', null, ''),
    ('carbon', null, '/gui/images/icons/carbon.png', '/gui/images/icons/carbon.png', 'currency', null, ''),
    ('trends', null, '/gui/images/icons/trends.png', '/gui/images/icons/trends.png', 'currency', null, ''),
    ('laser1', null, '/gui/images/icons/laser-red.png', '/gui/images/icons/laser-red.png', 'skin', 'Rare', 'RARE LASER SKIN'),
    ('laser2', null, '/gui/images/icons/laser-white.png', '/gui/images/icons/laser-white.png', 'skin', 'Mythic', 'MYTHIC LASER SKIN'),
    ('laser3', null, '/gui/images/icons/laser-violet.png', '/gui/images/icons/laser-violet.png', 'skin', 'Legendary', 'LEGENDARY LASER SKIN'),
    ('legendarybox', 10, '/gui/images/store/secret_box.png', '/gui/images/store/secret_box.png', 'physical', 'Legendary', 'LEGENDARY BOX'),
    ('thetrendsemoji', null, '/gui/images/store/trends_imogi.png', '/gui/images/store/trends_imogi.png', 'skin', 'Rare', ''),
    ('thetrendsticket', null, '/gui/images/store/tiskets.png', '/gui/images/store/tiskets.png', 'ticket', 'Rare', ''),
    ('thetrendsdiscount', 400, '/gui/images/store/trends_discount.png', '/gui/images/store/trends_discount.png', 'discount', 'Rare', ''),
    ('vorpalTshirt', null, '/gui/images/store/t-shirt.png', '/gui/images/store/t-shirt.png', 'physical', 'Rare', ''),
    ('alphatesterbadge', null, '/gui/images/store/alfa_tester.png', '/gui/images/store/alfa_tester.png', 'badge', 'Rare', ''),
    ('betatesterbadge', null, '/gui/images/store/beta_tester.png', '/gui/images/store/beta_tester.png', 'badge', 'Rare', '');
`,`
  INSERT INTO public.item_description_extended(
	item_id, title, description_en, description_ru)
	VALUES 
    (1, 'VRP', '', ''), 
    (2, 'spore', '', ''),
    (3, 'spice', '', ''), 
    (4, 'metal', '', ''), 
    (5, 'biomass', '', ''), 
    (6,'carbon', '', ''), 
    (7, 'trends', '', ''), 
    (8, 'RARE LASER SKIN', 'Rare laser red color', 'Редкий красный цвет для лазера'), 
    (9, 'MYTHIC LASER SKIN', 'Very rare white color for laser', 'Очень редкий белый цвет для лазера'), 
    (10,'LEGENDARY LASER SKIN', 'An extremely rare purple laser color', 'Чрезвычайно редкий фиолетовый цвет для лазера'), 
    (11, 'LEGENDARY BOX', 'Legendary physical case with secret rewards', 'Легендарный физический кейс с секретными наградами'), 
    (12, 'THE TRENDS EMOJI', 'Emoji in THE TRENDS style', 'Эмодзи в стиле THE TRENDS'), 
    (13,'THE TRENDS TICKET', 'Ticket for participation in the VIP ticket drawing', 'Билет для участия в розыгрыше ВИП билетов'), 
    (14,'THE TRENDS DISCOUNT', '30% discount on all tickets', 'Скидка 30% на все билеты'), 
    (15,'VORPAL T-SHIRT', 'VORPAL T-shirt', 'Футболка VORPAL'),
    (16,'ALPHA TESTER BADGE', 'Access to future closed alpha tests', 'Доступ к будущим закрытым альфа тестам'), 
    (17,'BETA TESTER BADGE', 'Access to future closed beta tests', 'Доступ к будущим закрытым бета тестам');
`,`
INSERT INTO public.store(
	item_id, currency_id, price, user_balance_limit, available_count)
	VALUES 
    (8, 1, 20, 1, null), 
    (9, 1, 100, 1, null), 
    (10,1, 250, 1, null), 
    (11, 1, 300, 1, 10), 
    (12, 7, 50, 1, null), 
    (13,7, 10, null, null), 
    (14,7, 30, 400, 400), 
    (15,1, 60,1, null),
    (16,1, 120,1,null), 
    (17,1, 30, 1, null);
`
];

export async function defaultDataSetup() {

}