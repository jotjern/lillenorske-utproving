DROP TABLE articles;
DROP TABLE loginKeys;
DROP TABLE sessions;
DROP TABLE reviews;
DROP TABLE reviewNotes;
DROP TABLE loginKeyOnArticle;
DROP TABLE suggestionsAndRankings;


CREATE TABLE articles (
	articleId SERIAL PRIMARY KEY,
	title text,
	html text
);

CREATE TABLE loginKeys (
	loginKeyId VARCHAR(16) PRIMARY KEY,
	schoolName text,
	grade text
);

CREATE TABLE sessions (
	sessionId VARCHAR(64) PRIMARY KEY,
	loginKeyId VARCHAR(16),
	CONSTRAINT fk_loginKeyId,
	FOREIGN KEY(loginKeyId)
	REFERENCES loginKeys(loginKeyId)
	ON DELETE SET NULL
);

CREATE TABLE reviews (
	reviewId SERIAL PRIMARY KEY,
	articleId int,
	CONSTRAINT fk_articleId
	FOREIGN KEY(articleId)
	REFERENCES articles(articleId),
	sessionId VARCHAR(64),
	CONSTRAINT fk_sessionId
	FOREIGN KEY(sessionId)
	REFERENCES sessions(sessionId),
	preKnowledge text,
	surveyRating text,
	surveyDifficulty text,
	surveySuitableAge text,
	surveyLearnedSomething text,
	skipped bool DEFAULT false
);

CREATE TABLE reviewNotes (
	reviewNoteId SERIAL PRIMARY KEY,
	reviewId int,
	CONSTRAINT fk_reviewId
	FOREIGN KEY(reviewId)
	REFERENCES reviews(reviewId),
	type text,
	index int,
	text text,
	reason text
);

CREATE TABLE loginKeyOnArticle (
	loginKeyId int NOT NULL,
	CONSTRAINT fk_loginKeyId
	FOREIGN KEY(loginKeyId)
	REFERENCES loginKeys(loginKeyId),
	articleId int NOT NULL,
	CONSTRAINT fk_articleId
	FOREIGN KEY(articleId)
	REFERENCES articles(articleId),
	articleNumber int,
	CONSTRAINT PK_loginKeyOnArticle PRIMARY KEY (loginKeyId, articleId)
);

CREATE TABLE suggestionsAndRankings (
	sessionId VARCHAR(64),
	CONSTRAINT fk_sessionId
	FOREIGN KEY(sessionId)
	REFERENCES sessions(sessionId),
	suggestion text,

	likedBestArticleId int,
	CONSTRAINT fk_likedBestArticleId
	FOREIGN KEY(likedBestArticleId)
	REFERENCES articles(articleId),

	easiestArticleId int,
	CONSTRAINT fk_easiestArticleId
	FOREIGN KEY(easiestArticleId)
	REFERENCES articles(articleId),

	hardestArticleId int,
	CONSTRAINT fk_hardestArticleId
	FOREIGN KEY(hardestArticleId)
	REFERENCES articles(articleId)
);

/*
INSERT INTO loginKeys (loginKeyId, schoolName, grade) VALUES ('ABCDEFGHIJKLMNOP', 'NTNU', '1. Trinn');

INSERT INTO articles (title, html) VALUES
('fjellrev', '<p><strong>fjellrev</strong></p><p>er et lite <a href="https://snl.no/rovpattedyr">rovpattedyr</a> i <a href="https://snl.no/ hundefamilien">hundefamilien</a> som har sin naturlige utbredelse i Nord-Amerika, Europa og Russland. </p><p>Som voksen er den ca. 60 cm lang og veier rundt 3,5 kilo. </p><p>Arten er en jeger som lever av sm?? <a href = "https://snl.no/varmblodige_dyr">varmblodige dyr</a> og <a href="https://snl.no/virvell%C3%B8se_dyr">virvell??se dyr</a> (invertebrater) den fanger p?? bakken. </p><p>Den <a href="https://snl.no/formering_-_biologi">formerer</a> seg ??n gang i ??ret og f??r rundt ??tte unger i hvert kull. <a href="https://snl.no/drektighet">Drektighetstiden</a> varer i ca. 52 dager. Ungene blir diet av mora i om lag sju uker etter f??dselen og blir <a href="https://snl.no/kj??nnsmodenhet">kj??nnsmodne</a> i l??pet av 43 uker. </p><p>Den lever vanligvis til den er rundt 15 ??r gammel. </p>'),
('sobel', '<p><strong>sobel (dyr)</strong></p><p>er et lite <a href="https://snl.no/rovpattedyr">rovpattedyr</a> i <a href="https://snl.no/ m%C3%A5rfamilien">m??rfamilien</a> som har sin naturlige utbredelse i Asia og Russland. </p><p>Som voksen er den ca. 50 cm lang, hannen veier rundt 1,5 kilo og hunnen rundt 1,1 kilo. </p><p>Arten er knyttet til <a href="https://snl.no/boreal">boreal</a> og <a href="https://snl.no/tempererte_soner">temperert</a> skog. Den s??ker etter mat p?? natta og lever av sm?? <a href = "https://snl.no/varmblodige_dyr">varmblodige dyr</a> og fisk den fanger i vann og p?? bakken. </p><p>Den f??r rundt tre unger i hvert kull. <a href="https://snl.no/drektighet">Drektighetstiden</a> varer i ca. 30 dager. Ungene blir diet av mora i om lag ??tte uker etter f??dselen og blir <a href="https://snl.no/kj??nnsmodenhet">kj??nnsmodne</a> i l??pet av ??n til to ??r. </p><p>Levetiden er vanligvis rundt 18 ??r, men enkelte <a href="https://snl.no/individ_-_biologi">individer</a> kan bli opptil 22 ??r gamle. </p>'),
('nebbdyr', '<p><strong>nebbdyr</strong></p><p>er et pattedyr i nebbdyrfamilien og en av de st??rste <a href="https://snl.no/kloakkdyr">kloakkdyrene</a> i verden. Den har sin naturlige utbredelse i Australia. </p><p>Som voksen er den ca. 40 cm lang og veier rundt ??n kilo. </p><p>Arten er knyttet til elver og bekker og er en nattaktiv jeger som lever av <a href="https://snl.no/virvell%C3%B8se_dyr">virvell??se dyr</a> (invertebrater) den fanger p?? bakken. </p><p>Den <a href="https://snl.no/formering_-_biologi">formerer</a> seg ??n gang i ??ret og f??r som oftest to unger i hvert kull. <a href="https://snl.no/drektighet">Drektighetstiden</a> varer i ca. 15 dager. Ungene blir diet av mora i om lag fire m??neder etter f??dselen og blir <a href="https://snl.no/kj??nnsmodenhet">kj??nnsmodne</a> i l??pet av to til tre ??r. </p><p>Levetiden er vanligvis rundt 17 ??r, men enkelte <a href="https://snl.no/individ_-_biologi">individer</a> kan bli opptil 23 ??r gamle. </p>'),
('bj??rn', '<p><strong>bj??rn</strong></p><p>er et stort <a href="https://snl.no/rovpattedyr">rovpattedyr</a> i <a href="https://snl.no/ bj%C3%B8rner">Bj??rnefamilien</a> som har sin naturlige utbredelse i Asia, Europa, Nord-Amerika, Midt??sten og Russland. </p><p>Som voksen er den ca. 2,3 meter lang og veier rundt 180 kilo. </p><p>Arten er knyttet til ulike <a href="https://snl.no/habitat">habitater</a>, blant annet <a href="https://snl.no/boreal">boreal</a>, <a href="https://snl.no/subarktisk">subarktisk</a> og <a href="https://snl.no/tempererte_soner">temperert</a> skog, subarktisk, <a href="https://snl.no/boreal">boreal</a> og <a href="https://snl.no/tempererte_soner">temperert</a> buskmark, t??rr og fuktig <a href="https://snl.no/tropisk">tropisk</a> buskmark,  <a href="https://snl.no/tundra">tundra</a>, og <a href="https://snl.no/subarktisk">subarktisk</a> og <a href="https://snl.no/tempererte_soner">temperert</a> gressmark. Den er en planteeter som lever av plantedeler og frukt den finner p?? bakken. </p><p>Den <a href="https://snl.no/formering_-_biologi">formerer</a> seg hvert andre til tredje ??r og f??r som oftest to unger i hvert kull. <a href="https://snl.no/drektighet">Drektighetstiden</a> varer i ca. 103 dager. Ungene blir diet av mora i om lag sju m??neder etter f??dselen og blir <a href="https://snl.no/kj??nnsmodenhet">kj??nnsmodne</a> i l??pet av fire til fem ??r. </p><p>Den lever vanligvis til den er rundt 44 ??r gammel. </p>'),
('pungdjevel', '<p><strong>pungdjevel</strong></p><p>er et pattedyr i <a href="https://snl.no/ rovpungdyr">Rovpungdyrfamilien</a> og en av de minste <a href="https://snl.no/rovpungdyr">rovpungdyrene</a> i verden. Den har sin naturlige utbredelse i Australia. </p><p>Som voksen er den ca. 70 cm lang, hannen veier rundt ni kilo og hunnen rundt sju kilo. </p><p>Arten s??ker etter mat p?? natta og lever av <a href="https://snl.no/%C3%A5tsel">??tsler</a> den finner p?? bakken. </p><p>Den <a href="https://snl.no/formering_-_biologi">formerer</a> seg ??n gang i ??ret og f??r rundt tre unger i hvert kull. <a href="https://snl.no/drektighet">Drektighetstiden</a> varer i ca. 26 dager. Ungene blir diet av mora i om lag ??tte m??neder etter f??dselen og blir <a href="https://snl.no/kj??nnsmodenhet">kj??nnsmodne</a> i l??pet av to til tre ??r. </p><p>Levetiden er vanligvis rundt 8 ??r, men enkelte <a href="https://snl.no/individ_-_biologi">individer</a> kan bli opptil 13 ??r gamle. </p>');

INSERT INTO loginKeyOnArticle (loginKeyId, articleId, articleNumber) VALUES
	('ABCDEFGHIJKLMNOP', (SELECT articleId FROM ARTICLES LIMIT 1 OFFSET 1) , 1),
	('ABCDEFGHIJKLMNOP', (SELECT articleId FROM ARTICLES LIMIT 1 OFFSET 2), 2),
	('ABCDEFGHIJKLMNOP', (SELECT articleId FROM ARTICLES LIMIT 1 OFFSET 3), 3)
 */
