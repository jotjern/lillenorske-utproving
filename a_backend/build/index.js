"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const process = __importStar(require("process"));
const cors_1 = __importDefault(require("cors"));
const pg_1 = __importDefault(require("pg"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
const axios_1 = __importDefault(require("axios"));
const port = process.env.PORT || 15151;
const app = (0, express_1.default)();
const db = JSON.parse(fs.readFileSync(__dirname + "/../db.json", "utf8"));
const pool = new pg_1.default.Pool({
    port: db.port,
    host: db.host,
    user: db.user,
    password: db.password,
    database: db.database,
});
const md5 = (content) => (0, crypto_1.createHash)("md5").update(Buffer.from(content, "utf-8")).digest("hex");
const admin_password = "0d96635dbb24b52d0a791775b4130571";
async function emergencyReset() {
    (0, child_process_1.exec)("sudo systemctl restart backend.service");
}
async function getState(sessionId) {
    try {
        console.log("Querying for articles...");
        const articles = await pool.query(`
            SELECT
                articles.articleId as id, regexp_replace(articles.title, ' \\(NN\\)', '') AS title, articles.html AS html, loginKeyOnArticle.articleNumber AS articleNumber
            FROM loginKeyOnArticle
                     INNER JOIN articles ON loginKeyOnArticle.articleId = articles.articleId
            WHERE loginKeyId IN (SELECT loginKeyId
                                 FROM sessions
                                 WHERE sessionId = $1)
              AND articles.articleId NOT IN (SELECT articleId
                                             FROM reviews
                                             WHERE sessionId = $1)
            ORDER BY articleNumber LIMIT 1;
        `, [sessionId]);
        console.log(`Amount of articles: ${articles.rows.length}`);
        if (articles.rows.length === 0) {
            const suggestions = await pool.query(`SELECT count(*) FROM suggestionsAndRankings WHERE sessionId = $1`, [sessionId]);
            if (parseInt(suggestions.rows[0].count) === 0) {
                const session = await pool.query("SELECT count(*) FROM sessions WHERE sessionId = $1", [sessionId]);
                if (parseInt(session.rows[0].count) === 0) {
                    return null;
                }
                else {
                    const reviewedArticles = await getReviewedArticles(sessionId);
                    return {
                        state: "suggest",
                        articlesToRank: reviewedArticles
                    };
                }
            }
            else {
                return {
                    state: "thankyou"
                };
            }
        }
        return {
            state: "read",
            article: {
                title: articles.rows[0].title,
                html: articles.rows[0].html,
                id: articles.rows[0].id,
                number: articles.rows[0].articlenumber
            }
        };
    }
    catch (e) {
        return null;
    }
}
function isInvalidForm(form) {
    if (typeof form !== "object")
        return "Invalid form type";
    if (typeof form.pre_knowledge !== "string")
        return "Invalid pre_knowledge type";
    if (["none", "some", "a lot"].indexOf(form.pre_knowledge) === -1)
        return "Invalid pre_knowledge value";
    if (typeof form.survey !== "object")
        return "Invalid survey type";
    if (typeof form.survey.skip !== "boolean")
        return "Invalid survey.skip type";
    if (typeof form.survey.difficulty !== "string")
        return "Invalid survey.difficulty type";
    if (["easy", "medium", "hard"].indexOf(form.survey.difficulty) === -1)
        return "Invalid survey.difficulty value";
    if (typeof form.survey.rating !== "string")
        return "Invalid survey.rating type";
    if (["bad", "ok", "good"].indexOf(form.survey.rating) === -1)
        return "Invalid survey.rating value";
    if (typeof form.survey.suitable_age !== "string")
        return "Invalid survey.suitable_age type";
    if (["small_children", "8-9", "10-11", "12-13", "adult"].indexOf(form.survey.suitable_age) === -1)
        return "Invalid survey.suitable_age value";
    if (typeof form.survey.learned_something !== "string")
        return "Invalid survey.learned_something type";
    if (["yes", "no"].indexOf(form.survey.learned_something) === -1)
        return "Invalid survey.learned_something value";
    if (!Array.isArray(form.article_notes))
        return "Invalid article_notes type";
    for (const note of form.article_notes) {
        if (typeof note !== "object")
            return "Invalid article_note type";
        if (typeof note.reason !== "string")
            return "Invalid article_note.reason type";
        if (["understanding", "unnecessary", "good"].indexOf(note.reason) === -1)
            return "Invalid article_note.reason value";
        if (typeof note.index !== "number")
            return "Invalid article_note.index type";
        if (typeof note.text !== "string")
            return "Invalid article_note.text type";
        if (note.text.length > 1000 || note.text.length < 1)
            return "Invalid article_note.text length";
        if (typeof note.type !== "string")
            return "Invalid article_note.type type";
        if (["word", "element"].indexOf(note.type) === -1)
            return "Invalid article_note.type value";
    }
    return null;
}
async function getSchoolStats() {
    const result = await pool.query(`
        SELECT schoolName, grade, count(*) AS count
        FROM sessions
        JOIN loginKeys USING (loginKeyId)
        GROUP BY schoolName, grade`);
    return result.rows.map(row => ({
        schoolName: row.schoolname,
        grade: row.grade,
        count: parseInt(row.count)
    }));
}
async function getControlPanelStats() {
    const result = await pool.query(`
        SELECT
            (SELECT count(*) FROM sessions) AS sessions,
            (SELECT count(*) FROM articles) AS articles,
            (SELECT count(*) FROM reviews) AS reviews,
            (SELECT count(*) FROM reviewNotes) AS reviewNotes,
            (SELECT count(*) FROM suggestionsAndRankings) AS suggestionsAndRankings
    `);
    return {
        sessions: parseInt(result.rows[0].sessions),
        articles: parseInt(result.rows[0].articles),
        reviews: parseInt(result.rows[0].reviews),
        reviewNotes: parseInt(result.rows[0].reviewnotes),
        suggestionsAndRankings: parseInt(result.rows[0].suggestionsandrankings)
    };
}
async function getEndStats() {
    const queries = new Map(Object.entries({
        mostReportedWords: `
            SELECT count(*), type, reason, text as text FROM reviewNotes
            INNER JOIN reviews USING (reviewId)
            WHERE type = 'word'
            GROUP BY (type, reason, text)
            ORDER BY count(*) DESC
            LIMIT 100
        `,
        mostReportedElements: `
            SELECT count(*), type, reason, text as text FROM reviewNotes
            INNER JOIN reviews USING (reviewId)
            WHERE type = 'element'
            GROUP BY (type, reason, text)
            ORDER BY count(*) DESC
            LIMIT 100
        `,
        mostReportedSpecificWords: `
                SELECT
                    count(*), articleId, type, index, reason, min(text) as text
                FROM reviewNotes
                INNER JOIN
                    reviews USING (reviewId)
                WHERE
                    type = 'word'
                GROUP BY
                    (articleId, type, index, reason)
                ORDER BY
                    count(*) DESC
                LIMIT 100
            `,
        mostReportedSpecificElements: `
                SELECT
                    count(*), articleId, type, index, reason, min(text) as text
                FROM reviewNotes
                INNER JOIN
                    reviews USING (reviewId)
                WHERE
                    type = 'element'
                GROUP BY
                    (articleId, type, index, reason)
                ORDER BY
                    count(*) DESC
                LIMIT 100
            `,
        articleRatings: `
                SELECT articleId, title, likedBestCount, easiestCount, hardestCount FROM articles
                INNER JOIN (
                    SELECT
                        likedBestArticleId, count(likedBestArticleId) as likedBestCount
                    FROM
                        suggestionsAndRankings
                    GROUP BY
                        likedBestArticleId
                    ORDER BY
                        count(likedBestArticleId) DESC
                ) likedBest ON likedBest.likedBestArticleId = articleId
                INNER JOIN (
                    SELECT
                        easiestArticleId, count(easiestArticleId) as easiestCount
                    FROM
                        suggestionsAndRankings
                    GROUP BY
                        easiestArticleId
                    ORDER BY
                        count(easiestArticleId) DESC
                ) easiest ON easiest.easiestArticleId = articleId
                INNER JOIN (
                    SELECT
                        hardestArticleId, count(hardestArticleId) as hardestCount
                    FROM
                        suggestionsAndRankings
                    GROUP BY
                        hardestArticleId
                    ORDER BY
                        count(hardestArticleId) DESC
                ) hardest ON hardest.hardestArticleId = articleId;
            `,
        aggregatedNotes: `
                SELECT
                    count(*), articleId, type, index, reason, min(text) as text FROM reviewNotes
                INNER JOIN
                    reviews USING (reviewId)
                GROUP BY
                    (articleId, type, index, reason)
                ORDER BY
                    count(*) DESC
                LIMIT 100
            `,
        noteCategoryCounts: `
                SELECT count(*), reason, type FROM reviewNotes GROUP BY (reason, type);
            `,
        popularSuggestions: `
                SELECT
                    TRIM(LOWER(suggestion)) AS suggestion, count(*)
                FROM
                    suggestionsAndRankings
                WHERE
                    TRIM(LOWER(suggestion)) != ''
                GROUP BY
                    TRIM(LOWER(suggestion))
                ORDER BY
                    count(*) DESC
            `
    }));
    const client = await pool.connect();
    try {
        const ret = new Map();
        for (const [key, query] of queries.entries()) {
            ret.set(key, (await client.query(query)).rows);
        }
        return ret;
    }
    catch (e) {
        console.log("!!!!");
        console.error(e);
        return null;
    }
    finally {
        client.release();
    }
}
async function submitReview(form, articleId, sessionId) {
    var _a, _b, _c, _d, _e;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`
            INSERT INTO reviews (articleId, sessionId, preKnowledge, surveyRating, surveyDifficulty, surveySuitableAge, surveyLearnedSomething)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING reviewId;
        `, [articleId, sessionId, form.pre_knowledge, (_a = form.survey) === null || _a === void 0 ? void 0 : _a.rating, (_b = form.survey) === null || _b === void 0 ? void 0 : _b.difficulty, (_c = form.survey) === null || _c === void 0 ? void 0 : _c.suitable_age, (_d = form.survey) === null || _d === void 0 ? void 0 : _d.learned_something]);
        const reviewId = result.rows[0].reviewid;
        for (const note of form.article_notes) {
            await client.query(`
                INSERT INTO reviewNotes (reviewId, type, index, text, reason)
                VALUES ($1, $2, $3, $4, $5);
            `, [reviewId, note.type, note.index, note.text, note.reason]);
        }
        if ((_e = form.survey) === null || _e === void 0 ? void 0 : _e.skip) {
            if (!await skipReviews(sessionId, client)) {
                throw new Error("Failed to skip reviews");
            }
        }
        await client.query("COMMIT");
    }
    catch (e) {
        await client.query("ROLLBACK");
        return false;
    }
    finally {
        try {
            client.release();
        }
        catch (e) { }
    }
    return true;
}
async function skipReviews(sessionId, client) {
    try {
        await client.query(`
            INSERT INTO reviews
                (articleId, sessionId, surveyRating, surveySuitableAge, surveyLearnedSomething, surveyDifficulty, preknowledge, skipped)
                SELECT
                    articleId,
                    $1 AS sessionId,
                    NULL as surveyRating,
                    NULL as surveySuitableAge,
                    NULL AS surveyLearnedSomething,
                    NULL AS surveyDifficulty,
                    NULL AS preknowledge,
                    true AS skipped
                FROM loginKeyOnArticle
                WHERE loginKeyId = (
                    SELECT loginKeyId FROM sessions
                    WHERE sessionId = $2
                ) AND articleId NOT IN (
                    SELECT articleId FROM reviews WHERE sessionId = $3
                )
        `, [sessionId, sessionId, sessionId]);
        return true;
    }
    catch (e) {
        return false;
    }
}
async function getReviewedArticles(sessionId) {
    const result = await pool.query(`
        SELECT regexp_replace(title, ' \\(NN\\)', '') as title, articles.articleId, loginKeyOnArticle.articleNumber FROM loginKeyOnArticle
        INNER JOIN articles ON articles.articleId = loginKeyOnArticle.articleId
        WHERE loginKeyId = (
        	SELECT loginKeyId FROM sessions WHERE sessionId = $1
        )
        AND loginKeyOnArticle.articleId IN (
        	SELECT articleId FROM reviews
        	WHERE sessionId = $2
        	AND NOT reviews.skipped
        )
        ORDER BY articleNumber
    `, [sessionId, sessionId]);
    return result.rows.map(row => ({
        title: row.title,
        articleId: row.articleid,
        articleNumber: row.articlenumber
    }));
}
async function createSession(loginKey) {
    const sessionId = crypto.randomBytes(32).toString("hex");
    try {
        await pool.query(`
            INSERT INTO sessions (sessionId, loginKeyId)
            VALUES ($1, $2);
        `, [sessionId, loginKey]);
    }
    catch (e) {
        return null;
    }
    return sessionId;
}
async function getArticleNotes(article) {
    const result = await pool.query(`
        SELECT index, text, reason, type FROM reviewNotes
        INNER JOIN reviews ON reviews.reviewId = reviewNotes.reviewId
        WHERE reviews.articleId = $1
    `, [article]);
    return result.rows.map(row => ({
        index: row.index,
        reason: row.reason,
        type: row.type,
        text: row.text
    }));
}
async function getNthArticle(n) {
    const result = await pool.query(`
        SELECT articleId, html, regexp_replace(articles.title, ' \\(NN\\)', '') AS title FROM articles ORDER BY title LIMIT 1 OFFSET $1`, [n]);
    return {
        articleId: result.rows[0].articleid,
        html: result.rows[0].html,
        title: result.rows[0].title
    };
}
async function createLoginKey(schoolName, grade, articles) {
    const loginKey = crypto.randomBytes(8).toString("hex");
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(`
            INSERT INTO loginKeys (loginKey, schoolName, grade)
            VALUES ($1, $2, $3);
        `, [loginKey, schoolName, grade]);
        await client.query(`
            INSERT INTO loginKeyOnArticle (loginKeyId, articleId, articleNumber)
            VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9);
        `, [loginKey, articles[0], 1, loginKey, articles[1], 2, loginKey, articles[2], 3]);
        await client.query("COMMIT");
    }
    catch (e) {
        await client.query("ROLLBACK");
        return false;
    }
    finally {
        try {
            client.release();
        }
        catch (e) { }
    }
    return true;
}
async function submitSuggestionsAndRankings(sessionId, suggestion, rankings) {
    try {
        await pool.query(`
            INSERT INTO suggestionsAndRankings (sessionId, suggestion, likedBestArticleId, easiestArticleId, hardestArticleId)
            VALUES ($1, $2, $3, $4, $5);
        `, [sessionId, suggestion, rankings.likedBest, rankings.easiest, rankings.hardest]);
    }
    catch (e) {
        return false;
    }
    return true;
}
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((req, res, next) => {
    res.on("finish", () => console.log(`${req.method} ${req.url} -> ${res.statusCode}`));
    next();
});
app.get("/api/admin/crash", (req, res) => {
    throw new Error("Crash");
});
app.post("/api/admin/controlpanel", async (req, res) => {
    if (typeof req.body.password !== "string" || md5(req.body.password) !== admin_password)
        return res.status(403).send("Invalid token");
    const state = await getControlPanelStats();
    const schoolStats = await getSchoolStats();
    res.status(200).json({ state, schoolStats });
});
app.post("/api/admin/emergencyreset", async (req, res) => {
    if (md5(req.body.password) !== admin_password)
        return res.status(403).send("Invalid token");
    await emergencyReset();
    res.status(200).send("OK");
});
app.get("/api/admin/articles/:articleNumber/notes", async (req, res) => {
    let article;
    try {
        article = await getNthArticle(parseInt(req.params.articleNumber));
    }
    catch (e) {
        res.status(400).send("Invalid article number");
        return;
    }
    const notes = await getArticleNotes(article.articleId);
    res.status(200).json({
        article, notes
    });
});
app.get("/api/endstats", async (req, res) => {
    const stats = await getEndStats();
    res.json(Object.fromEntries(stats));
});
app.post("/api/login", async (req, res) => {
    const code = req.body.code;
    if (!code) {
        res.status(400).send("Missing code");
        return;
    }
    const session = await createSession(code);
    if (session === null) {
        res.status(401).send("Invalid code");
        return;
    }
    res.cookie("session", session, { httpOnly: true });
    res.status(200).send("OK");
});
app.use((req, res, next) => {
    const sessionId = req.cookies.session;
    if (!sessionId) {
        console.log("no");
        res.status(403).send("Missing session");
        return;
    }
    next();
});
app.get("/api/reviewed", async (req, res) => {
    const reviewed = await getReviewedArticles(req.cookies.session);
    res.json(reviewed);
});
app.get("/api/state", async (req, res) => {
    console.log("wow");
    const state = await getState(req.cookies.session);
    if (state === null) {
        res.status(401).send("Invalid session");
        return;
    }
    res.json(state);
});
app.post("/api/state", async (req, res) => {
    var _a;
    const sessionId = req.cookies.session;
    const state = await getState(sessionId);
    if (state === null) {
        res.status(401).send("Invalid session");
        return;
    }
    const invalid_reason = isInvalidForm(req.body);
    if (invalid_reason) {
        res.status(400).send(`Invalid review: ${invalid_reason}`);
        return;
    }
    if (await submitReview(req.body, (_a = state.article) === null || _a === void 0 ? void 0 : _a.id, sessionId)) {
        const state = await getState(sessionId);
        if (state === null) {
            res.status(500).send("Internal server error");
        }
        else {
            res.json(state);
        }
    }
    else {
        res.status(400).send("Bad request");
    }
});
app.post("/api/suggest", async (req, res) => {
    const sessionId = req.cookies.session;
    if (typeof req.body.suggestions !== "string") {
        res.status(400).send("Missing suggestions");
        return;
    }
    if (!req.body.rankings || typeof req.body.rankings !== "object") {
        res.status(400).send("Missing rankings");
        return;
    }
    let result;
    try {
        result = await submitSuggestionsAndRankings(sessionId, req.body.suggestions, req.body.rankings);
    }
    catch (e) {
        res.status(400);
        res.send("Invalid session");
        return;
    }
    if (result) {
        res.status(200).send("OK");
    }
    else {
        res.status(500).send("Internal server error");
    }
});
/*
app.get("/api/admin/notes/:article", async (req, res) => {
    const article = req.params.article;
    if (!article) {
        res.status(400).send("Missing article");
        return;
    }
    const notes = await getArticleNotes(article);
    res.status(200).json(notes);
});
 */
const webhook_url = fs.readFileSync("webhook.txt", "utf8").trim();
async function debugMessage(message) {
    await axios_1.default.post(webhook_url, {
        content: message
    });
}
app.use((err, req, res, next) => {
    // Get the whole error as a string
    debugMessage("```" + err.stack.toString() + "```").then(() => { });
    console.log(err.stack.toString());
    res.status(500).send("Internal server error");
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
