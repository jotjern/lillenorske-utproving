import fs from "fs";
import pg from "pg";

const db = JSON.parse(fs.readFileSync(__dirname + "/../db.json", "utf8"));
const pool = new pg.Pool({
    port: db.port,
    host: db.host,
    user: db.user,
    password: db.password,
    database: db.database,
});

const sessionId = "0a962d075365d92f3d5dac29fd8e529d0cb42f44385a8762cd1d3555a6ad969a";

pool.query(`
    SELECT 1
`).then(() => {
    console.log("SELECT 1")
}).finally(() => {
    console.log("pool.end")
    pool.end();
});
