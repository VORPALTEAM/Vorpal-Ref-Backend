import { defaultDataSetup } from "./defaultData";
import { createSQLDomains } from "./domains";
import { createSQLTables } from "./tables";


export default async function createStartDatabase () {
    createSQLDomains();
    createSQLTables();
    defaultDataSetup();
}