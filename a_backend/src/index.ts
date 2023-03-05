import express from "express";
import * as process from "process";
import cors from "cors";
import pg, {PoolClient} from "pg";
import cookieParser from "cookie-parser";
import * as crypto from "crypto";
import * as fs from "fs";

const port = process.env.PORT || 15151;
const app = express();

const db = JSON.parse(fs.readFileSync(__dirname + "/../db.json", "utf8"));
const pool = new pg.Pool({
    port: db.port,
    host: db.host,
    user: db.user,
    password: db.password,
    database: db.database,
});

async function getState(sessionId: string) {
    try {
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
            ORDER BY articleNumber LIMIT 1
        `, [sessionId]);

        if (articles.rows.length === 0) {
            const suggestions = await pool.query(
                `SELECT count(*) FROM suggestionsAndRankings WHERE sessionId = $1`,
                [sessionId]
            );
            if (parseInt(suggestions.rows[0].count) === 0) {
                const session = await pool.query("SELECT count(*) FROM sessions WHERE sessionId = $1", [sessionId]);
                if (parseInt(session.rows[0].count) === 0) {
                    return null;
                } else {
                    const reviewedArticles = await getReviewedArticles(sessionId);
                    return {
                        state: "suggest",
                        articlesToRank: reviewedArticles
                    }
                }
            } else {
                return {
                    state: "thankyou"
                }
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
        }
    } catch (e) {
        return null;
    }
}

type Form = {
    pre_knowledge: "none" | "some" | "a lot",
    article_notes: { reason: string, index: number, text: string, type: string }[],
    survey: {
        difficulty: "easy" | "medium" | "hard",
        rating: "bad" | "ok" | "good",
        suitable_age: "small_children" | "8-9" | "10-11" | "12-13" | "adult",
        learned_something: "yes" | "no",
        skip?: boolean
    },
}

function isInvalidForm(form: any): string | null {
    if (typeof form !== "object") return "Invalid form type";
    if (typeof form.pre_knowledge !== "string") return "Invalid pre_knowledge type";
    if ([ "none", "some", "a lot" ].indexOf(form.pre_knowledge) === -1) return "Invalid pre_knowledge value";
    if (typeof form.survey !== "object") return "Invalid survey type";
    if (typeof form.survey.skip !== "boolean") return "Invalid survey.skip type";
    if (typeof form.survey.difficulty !== "string") return "Invalid survey.difficulty type";
    if ([ "easy", "medium", "hard" ].indexOf(form.survey.difficulty) === -1) return "Invalid survey.difficulty value";
    if (typeof form.survey.rating !== "string") return "Invalid survey.rating type";
    if ([ "bad", "ok", "good" ].indexOf(form.survey.rating) === -1) return "Invalid survey.rating value";
    if (typeof form.survey.suitable_age !== "string") return "Invalid survey.suitable_age type";
    if ([ "small_children", "8-9", "10-11", "12-13", "adult" ].indexOf(form.survey.suitable_age) === -1) return "Invalid survey.suitable_age value";
    if (typeof form.survey.learned_something !== "string") return "Invalid survey.learned_something type";
    if ([ "yes", "no" ].indexOf(form.survey.learned_something) === -1) return "Invalid survey.learned_something value";
    if (!Array.isArray(form.article_notes)) return "Invalid article_notes type";
    for (const note of form.article_notes) {
        if (typeof note !== "object") return "Invalid article_note type";
        if (typeof note.reason !== "string") return "Invalid article_note.reason type";
        if ([ "understanding", "unnecessary", "good" ].indexOf(note.reason) === -1) return "Invalid article_note.reason value";
        if (typeof note.index !== "number") return "Invalid article_note.index type";
        if (typeof note.text !== "string") return "Invalid article_note.text type";
        if (note.text.length > 1000 || note.text.length < 1) return "Invalid article_note.text length";
        if (typeof note.type !== "string") return "Invalid article_note.type type";
        if (["word", "element"].indexOf(note.type) === -1) return "Invalid article_note.type value";
    }
    return null;
}

async function submitReview(form: Form, articleId: number, sessionId: string) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`
            INSERT INTO reviews (articleId, sessionId, preKnowledge, surveyRating, surveyDifficulty, surveySuitableAge, surveyLearnedSomething)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING reviewId;
        `, [articleId, sessionId, form.pre_knowledge, form.survey?.rating, form.survey?.difficulty, form.survey?.suitable_age, form.survey?.learned_something]);
        const reviewId = result.rows[0].reviewid;
        for (const note of form.article_notes) {
            await client.query(`
                INSERT INTO reviewNotes (reviewId, type, index, text, reason)
                VALUES ($1, $2, $3, $4, $5);
            `, [reviewId, note.type, note.index, note.text, note.reason]);
        }
        if (form.survey?.skip) {
            if (!await skipReviews(sessionId, client)) {
                throw new Error("Failed to skip reviews");
            }
        }
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        return false;
    } finally {
        client.release();
    }
    return true;
}

async function skipReviews(sessionId: string, client?: PoolClient) {
    client = client ?? await pool.connect();
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
    } catch (e) {
        return false;
    } finally {
        client.release();
    }
}

async function getReviewedArticles(sessionId: string) {
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

async function createSession(loginKey: string) {
    const sessionId = crypto.randomBytes(32).toString("hex");
    try {
        await pool.query(`
            INSERT INTO sessions (sessionId, loginKeyId)
            VALUES ($1, $2);
        `, [sessionId, loginKey]);
    } catch (e) {
        return null;
    }
    return sessionId;
}

async function getArticleNotes(article: string) {
    const result = await pool.query(`
        SELECT index, reason, type FROM reviewNotes
        INNER JOIN reviews ON reviews.reviewId = reviewNotes.reviewId
        WHERE reviews.articleId = 39
    `);
    return result.rows.map(row => ({
        index: row.index,
        reason: row.reason,
        type: row.type
    }));
}

async function createLoginKey(schoolName: string, grade: number, articles: number[]) {
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
    } catch (e) {
        await client.query("ROLLBACK");
        return false;
    } finally {
        client.release();
    }
    return true;
}

type PageRankings = {likedBest: number, easiest: number, hardest: number};

async function submitSuggestionsAndRankings(sessionId: string, suggestion: string, rankings: PageRankings) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(`
            INSERT INTO suggestionsAndRankings (sessionId, suggestion, likedBestArticleId, easiestArticleId, hardestArticleId)
            VALUES ($1, $2, $3, $4, $5);
        `, [sessionId, suggestion, rankings.likedBest, rankings.easiest, rankings.hardest]);

        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        return false;
    } finally {
        client.release();
    }
    return true;
}

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    res.on("finish", () => console.log(`${req.method} ${req.url} -> ${res.statusCode}`));
    next();
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
    res.cookie("session", session, {httpOnly: true});
    res.status(200).send("OK");
});

app.use((req, res, next) => {
    const sessionId = req.cookies.session;
    if (!sessionId) {
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
    const state = await getState(req.cookies.session);
    if (state === null) {
        res.status(401).send("Invalid session");
        return;
    }
    res.json(state);
});

app.post("/api/state", async (req, res) => {
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
    if (await submitReview(req.body, state.article?.id, sessionId)) {
        const state = await getState(sessionId)
        if (state === null) {
            res.status(500).send("Internal server error");
        } else {
            res.json(state);
        }
    } else {
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
    } catch (e) {
        res.status(400);
        res.send("Invalid session");
        return;
    }
    if (result) {
        res.status(200).send("OK");
    } else {
        res.status(500).send("Internal server error");
    }
});

app.get("/api/admin/notes/:article", async (req, res) => {
    const article = req.params.article;
    if (!article) {
        res.status(400).send("Missing article");
        return;
    }
    const notes = await getArticleNotes(article);
    res.status(200).json(notes);
});

app.get("/api/crash", (req, res) => {
    throw new Error("Crash");
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Get the whole error as a string
    console.log(err.stack.toString());
    res.status(500).send("Internal server error");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});