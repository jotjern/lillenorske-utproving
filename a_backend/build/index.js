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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
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
/*
pool.connect().then(async () => {
    const html_articles = fs.readFileSync(__dirname + "/../pattedyr_artikler.html", "utf8").split("\n\n");
    let n = 0;
    for (const article of html_articles) {
        if (!article || article.length < 10) continue;
        const title = article.split("<strong>")[1].split("</strong>")[0];
        console.log(title);
        if (++n > 5) break;
        await pool.query("INSERT INTO articles (title, html) VALUES ($1, $2)", [title, article]);
    }
});
 */
/*
Database schema:

articles:
    id: int
    title: text
    html: text
reviews:
    id: int
    rating: int
    articleId: text
    sessionId: text
sessions:
    id: text
    loginKeyId: int
loginKeys:
    id: text
    schoolName: text
    grade: int
    article1: int
    article2: int
    article3: int
 */
/*
Query to get current article:

SELECT id, title, html FROM articles
WHERE id IN (
    SELECT article_1, article_2, article_3
    FROM login_keys
    WHERE id = (SELECT loginKeyId FROM sessions WHERE id = $1);
) AND id NOT IN (
    SELECT articleId FROM reviews WHERE sessionId = $1
);

Query to generate a new session:

INSERT INTO sessions (id, loginKeyId) VALUES ($1, $2);
*/
function getState(sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const articles = yield pool.query(`
            SELECT articles.articleId as id, articles.title AS title, articles.html AS html, loginKeyOnArticle.articleNumber AS articleNumber
            FROM loginKeyOnArticle
                     INNER JOIN articles ON loginKeyOnArticle.articleId = articles.articleId
            WHERE loginKeyId IN (SELECT loginKeyId
                                 FROM sessions
                                 WHERE sessionId = $1)
              AND articles.articleId NOT IN (SELECT articleId
                                             FROM reviews
                                             WHERE sessionId = $1)
            ORDER BY articleNumber LIMIT 1
        `, [sessionId]);
            if (articles.rows.length === 0) {
                const suggestions = yield pool.query(`SELECT count(*) FROM suggestionsAndRankings WHERE sessionId = $1`, [sessionId]);
                if (parseInt(suggestions.rows[0].count) === 0) {
                    const reviewedArticles = yield getReviewedArticles(sessionId);
                    return {
                        state: "suggest",
                        articlesToRank: reviewedArticles
                    };
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
            throw e;
            return null;
        }
    });
}
function isValidForm(form) {
    if (typeof form !== "object")
        return false;
    if (typeof form.pre_knowledge !== "string")
        return false;
    if (["none", "some", "a lot"].indexOf(form.pre_knowledge) === -1)
        return false;
    if (typeof form.survey !== "object")
        return false;
    if (typeof form.survey.skip !== "boolean")
        return false;
    if (typeof form.survey.difficulty !== "string")
        return false;
    if (["easy", "medium", "hard"].indexOf(form.survey.difficulty) === -1)
        return false;
    if (typeof form.survey.rating !== "string")
        return false;
    if (["bad", "ok", "good"].indexOf(form.survey.rating) === -1)
        return false;
    if (typeof form.survey.suitable_age !== "string")
        return false;
    if (["small_children", "8-9", "10-11", "12-13", "adult"].indexOf(form.survey.suitable_age) === -1)
        return false;
    if (typeof form.survey.learned_something !== "string")
        return false;
    if (["yes", "no"].indexOf(form.survey.learned_something) === -1)
        return false;
    if (!Array.isArray(form.article_notes))
        return false;
    for (const note of form.article_notes) {
        if (typeof note !== "object")
            return false;
        if (typeof note.reason !== "string")
            return false;
        if (["understanding", "unnecessary", "good"].indexOf(note.reason) === -1)
            return false;
        if (typeof note.index !== "number")
            return false;
        if (typeof note.text !== "string")
            return false;
        if (note.text.length > 1000 || note.text.length < 1)
            return false;
        if (typeof note.type !== "string")
            return false;
        if (["word", "element"].indexOf(note.type) === -1)
            return false;
    }
    return true;
}
function submitReview(form, articleId, sessionId) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield pool.connect();
        console.log(form);
        try {
            yield client.query("BEGIN");
            const result = yield client.query(`
            INSERT INTO reviews (articleId, sessionId, preKnowledge, surveyRating, surveyDifficulty, surveySuitableAge, surveyLearnedSomething)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING reviewId;
        `, [articleId, sessionId, form.pre_knowledge, (_a = form.survey) === null || _a === void 0 ? void 0 : _a.rating, (_b = form.survey) === null || _b === void 0 ? void 0 : _b.difficulty, (_c = form.survey) === null || _c === void 0 ? void 0 : _c.suitable_age, (_d = form.survey) === null || _d === void 0 ? void 0 : _d.learned_something]);
            const reviewId = result.rows[0].reviewid;
            for (const note of form.article_notes) {
                yield client.query(`
                INSERT INTO reviewNotes (reviewId, type, index, text, reason)
                VALUES ($1, $2, $3, $4, $5);
            `, [reviewId, note.type, note.index, note.text, note.reason]);
            }
            if ((_e = form.survey) === null || _e === void 0 ? void 0 : _e.skip) {
                if (!(yield skipReviews(sessionId, client))) {
                    throw new Error("Failed to skip reviews");
                }
            }
            yield client.query("COMMIT");
            console.log("WE COMMIT");
        }
        catch (e) {
            throw e;
            console.log("WE ROLL");
            yield client.query("ROLLBACK");
            return false;
        }
        finally {
            client.release();
        }
        return true;
    });
}
function skipReviews(sessionId, client) {
    return __awaiter(this, void 0, void 0, function* () {
        client = client !== null && client !== void 0 ? client : yield pool.connect();
        try {
            yield client.query(`
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
            throw e;
            return false;
        }
    });
}
function getReviewedArticles(sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield pool.query(`
        SELECT articles.title, articles.articleId, loginKeyOnArticle.articleNumber FROM loginKeyOnArticle
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
    });
}
function createSession(loginKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const sessionId = crypto.randomBytes(32).toString("hex");
        try {
            yield pool.query(`
            INSERT INTO sessions (sessionId, loginKeyId)
            VALUES ($1, $2);
        `, [sessionId, loginKey]);
        }
        catch (e) {
            return null;
        }
        return sessionId;
    });
}
function getArticleNotes(article) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield pool.query(`
        SELECT index, reason, type FROM reviewNotes
        INNER JOIN reviews ON reviews.reviewId = reviewNotes.reviewId
        WHERE reviews.articleId = 39
    `);
        return result.rows.map(row => ({
            index: row.index,
            reason: row.reason,
            type: row.type
        }));
    });
}
function createLoginKey(schoolName, grade, articles) {
    return __awaiter(this, void 0, void 0, function* () {
        const loginKey = crypto.randomBytes(8).toString("hex");
        const client = yield pool.connect();
        try {
            yield client.query("BEGIN");
            yield client.query(`
            INSERT INTO loginKeys (loginKey, schoolName, grade)
            VALUES ($1, $2, $3);
        `, [loginKey, schoolName, grade]);
            yield client.query(`
            INSERT INTO loginKeyOnArticle (loginKeyId, articleId, articleNumber)
            VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9);
        `, [loginKey, articles[0], 1, loginKey, articles[1], 2, loginKey, articles[2], 3]);
            yield client.query("COMMIT");
        }
        catch (e) {
            yield client.query("ROLLBACK");
            return false;
        }
        finally {
            client.release();
        }
        return true;
    });
}
function submitSuggestionsAndRankings(sessionId, suggestion, rankings) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield pool.connect();
        try {
            yield client.query("BEGIN");
            yield client.query(`
            INSERT INTO suggestionsAndRankings (sessionId, suggestion, likedBestArticleId, easiestArticleId, hardestArticleId)
            VALUES ($1, $2, $3, $4, $5);
        `, [sessionId, suggestion, rankings.likedBest, rankings.easiest, rankings.hardest]);
            yield client.query("COMMIT");
        }
        catch (e) {
            throw e;
            yield client.query("ROLLBACK");
            return false;
        }
        return true;
    });
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
app.post("/api/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code = req.body.code;
    if (!code) {
        res.status(400).send("Missing code");
        return;
    }
    const session = yield createSession(code);
    if (session === null) {
        res.status(401).send("Invalid code");
        return;
    }
    res.cookie("session", session, { httpOnly: true });
    res.status(200).send("OK");
}));
app.use((req, res, next) => {
    const sessionId = req.cookies.session;
    if (!sessionId) {
        res.status(403).send("Missing session");
        return;
    }
    next();
});
app.get("/api/reviewed", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reviewed = yield getReviewedArticles(req.cookies.session);
    res.json(reviewed);
}));
app.get("/api/state", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const state = yield getState(req.cookies.session);
    if (state === null) {
        res.status(401).send("Invalid session");
        return;
    }
    res.json(state);
}));
app.post("/api/state", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const sessionId = req.cookies.session;
    const state = yield getState(sessionId);
    if (state === null) {
        res.status(401).send("Invalid session");
        return;
    }
    if (!isValidForm(req.body)) {
        res.status(400).send("Invalid review");
        return;
    }
    if (yield submitReview(req.body, (_a = state.article) === null || _a === void 0 ? void 0 : _a.id, sessionId)) {
        const state = yield getState(sessionId);
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
}));
app.post("/api/suggest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionId = req.cookies.session;
    if (typeof req.body.suggestions !== "string") {
        res.status(400).send("Missing suggestions");
        return;
    }
    if (!req.body.rankings || typeof req.body.rankings !== "object") {
        res.status(400).send("Missing rankings");
        return;
    }
    if (typeof req.body.rankings.likedBest !== "number" || typeof req.body.rankings.easiest !== "number" || typeof req.body.rankings.hardest !== "number") {
        res.status(400).send("Invalid rankings");
        return;
    }
    if (yield submitSuggestionsAndRankings(sessionId, req.body.suggestions, req.body.rankings)) {
        res.status(200).send("OK");
    }
    else {
        res.status(500).send("Internal server error");
    }
}));
app.get("/api/admin/notes/:article", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const article = req.params.article;
    if (!article) {
        res.status(400).send("Missing article");
        return;
    }
    const notes = yield getArticleNotes(article);
    res.status(200).json(notes);
}));
app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
