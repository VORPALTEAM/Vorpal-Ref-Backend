import { createSQLConstraints } from "./constraints";
import { defaultDataSetup } from "./defaultData";
import { createSQLDomains } from "./domains";
import { createSQLTables } from "./tables";


export default async function createVorpalDatabase () {
    createSQLDomains();
    createSQLTables();
    createSQLConstraints();
    defaultDataSetup();
}