import createVorpalDatabase from "../models/createDB";


console.log("Creating DB: ");

createVorpalDatabase ().then(() => {
    console.log("DB created")
}).catch((e) => {
    console.log("DB creation error: ", e)
})