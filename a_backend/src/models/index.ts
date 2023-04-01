import {Pool, PoolClient, QueryResult} from "pg";
import crypto from "crypto";


export type Survey = {
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

export default (pool: Pool) => {
    async function getSession(sessionId: string) {
        const result = await pool.query(`
            SELECT loginKeyId, sessionId, schoolName, grade
            FROM sessions
            INNER JOIN loginKeys
            USING (loginKeyId)
            WHERE sessionId = $1
            LIMIT 1;
        `, [ sessionId ]);
        if (result.rows.length === 0) return null;
        return {
            loginKeyId: result.rows[0].loginkeyid,
        }
    }
    async function getSessionCountByClass() {
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

    async function getUserStatistics() {
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
        }
    }

    async function submitReview(form: Survey, articleId: number, sessionId: string) {
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
                if (!await skipRemainingSurveysForSession(sessionId, client)) {
                    throw new Error("Failed to skip reviews");
                }
            }
            await client.query("COMMIT");
        } catch (e) {
            await client.query("ROLLBACK");
            return false;
        } finally {
            try {
                client.release();
            } catch (e) { }
        }
        return true;
    }

    async function skipRemainingSurveysForSession(sessionId: string, client: PoolClient) {
        /*
        Skips all remaining articles queued for review for a given session.
         */
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
        }
    }

    async function getReviewedArticles(sessionId: string) {
        /*
        Returns a list of all articles reviewed by a given session.
         */
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
        /*
        Creates a new session for a given login key.
         */
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

    async function getNotesOnArticle(article: string) {
        /*
        Lists all notes submitted on an article.
         */
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

    async function getNthArticle(n: number) {
        /*
        Gets the nth article alphabetically, where n is 0-indexed.
         */
        const result = await pool.query(`
        SELECT articleId, html, regexp_replace(articles.title, ' \\(NN\\)', '') AS title FROM articles ORDER BY title LIMIT 1 OFFSET $1`, [n]);
        return {
            articleId: result.rows[0].articleid,
            html: result.rows[0].html,
            title: result.rows[0].title
        };
    }

    async function createLoginKey(schoolName: string, grade: number, articles: number[]) {
        const loginKey = crypto.randomBytes(8).toString("hex");
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query(`
            INSERT INTO loginKeys (loginKeyId, schoolName, grade)
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
            try {
                client.release();
            } catch (e) {}
        }
        return true;
    }

    async function submitSuggestionsAndRankings(sessionId: string, suggestion: string, rankings: { likedBest: number, easiest: number, hardest: number }) {
        try {
            await pool.query(`
            INSERT INTO suggestionsAndRankings (sessionId, suggestion, likedBestArticleId, easiestArticleId, hardestArticleId)
            VALUES ($1, $2, $3, $4, $5);
        `, [sessionId, suggestion, rankings.likedBest, rankings.easiest, rankings.hardest]);
        } catch (e) {
            return false;
        }
        return true;
    }


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
            ORDER BY articleNumber LIMIT 1;
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

    async function getEndStats(): Promise<Map<string, QueryResult<any>> | null> {
        const queries = new Map<string, string>(Object.entries({
            mostReportedWords: `
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
            mostReportedElements: `
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
                LIMIT 10;
            `
        }));

        const client = await pool.connect();
        try {
            // Do all queries in parallel
            const results = await Promise.all(Object.keys(queries).map(async (key) => {
                const query = queries.get(key);
                if (query === undefined) {
                    throw new Error("Query not found");
                }
                const result = await client.query(query);
                return { [key]: result.rows };
            }));

            // Merge results into one object
            return results.reduce((acc, cur) => {
                return Object.assign(acc, cur);
            }, new Map<string, any>());
        } catch (e) {
            console.error(e);
            return null;
        }
    }


    return {
        getSchoolStats: getSessionCountByClass, getNotesOnArticle, getNthArticle, createLoginKey, createSession, getState, submitSuggestionsAndRankings, submitReview, getControlPanelStats: getUserStatistics, getReviewedArticles
    }
}