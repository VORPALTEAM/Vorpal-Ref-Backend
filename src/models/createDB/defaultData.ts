import { massRunQueries } from "../connection"

const defaultDataSetupQueries = [
`  -- Insert languages
INSERT INTO "languages" (short_name, name) VALUES ('ru', 'Русский'), ('en', 'English');`,
`-- Insert roles
INSERT INTO "roles" (name) VALUES ('user'), ('admin');`,
`-- Insert network families
INSERT INTO "network_families" (name) VALUES ('TON'), ('EVM');`
];

export async function defaultDataSetup() {

}