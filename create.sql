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
	grade int
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
	skipped bool
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

INSERT INTO loginKeys (loginKeyId, schoolName, grade) VALUES ('ABCDEFGHIJKLMNOP', 'NTNU', 1);

INSERT INTO articles (title, html) VALUES
('fjellrev', '<p><strong>fjellrev</strong></p><p>er et lite <a href="https://snl.no/rovpattedyr">rovpattedyr</a> i <a href="https://snl.no/ hundefamilien">hundefamilien</a> som har sin naturlige utbredelse i Nord-Amerika, Europa og Russland. </p><p>Som voksen er den ca. 60 cm lang og veier rundt 3,5 kilo. </p><p>Arten er en jeger som lever av små <a href = "https://snl.no/varmblodige_dyr">varmblodige dyr</a> og <a href="https://snl.no/virvell%C3%B8se_dyr">virvelløse dyr</a> (invertebrater) den fanger på bakken. </p><p>Den <a href="https://snl.no/formering_-_biologi">formerer</a> seg én gang i året og får rundt åtte unger i hvert kull. <a href="https://snl.no/drektighet">Drektighetstiden</a> varer i ca. 52 dager. Ungene blir diet av mora i om lag sju uker etter fødselen og blir <a href="https://snl.no/kjønnsmodenhet">kjønnsmodne</a> i løpet av 43 uker. </p><p>Den lever vanligvis til den er rundt 15 år gammel. </p>'),
('sobel', '<p><strong>sobel (dyr)</strong></p><p>er et lite <a href="https://snl.no/rovpattedyr">rovpattedyr</a> i <a href="https://snl.no/ m%C3%A5rfamilien">mårfamilien</a> som har sin naturlige utbredelse i Asia og Russland. </p><p>Som voksen er den ca. 50 cm lang, hannen veier rundt 1,5 kilo og hunnen rundt 1,1 kilo. </p><p>Arten er knyttet til <a href="https://snl.no/boreal">boreal</a> og <a href="https://snl.no/tempererte_soner">temperert</a> skog. Den søker etter mat på natta og lever av små <a href = "https://snl.no/varmblodige_dyr">varmblodige dyr</a> og fisk den fanger i vann og på bakken. </p><p>Den får rundt tre unger i hvert kull. <a href="https://snl.no/drektighet">Drektighetstiden</a> varer i ca. 30 dager. Ungene blir diet av mora i om lag åtte uker etter fødselen og blir <a href="https://snl.no/kjønnsmodenhet">kjønnsmodne</a> i løpet av én til to år. </p><p>Levetiden er vanligvis rundt 18 år, men enkelte <a href="https://snl.no/individ_-_biologi">individer</a> kan bli opptil 22 år gamle. </p>'),
('nebbdyr', '<p><strong>nebbdyr</strong></p><p>er et pattedyr i nebbdyrfamilien og en av de største <a href="https://snl.no/kloakkdyr">kloakkdyrene</a> i verden. Den har sin naturlige utbredelse i Australia. </p><p>Som voksen er den ca. 40 cm lang og veier rundt én kilo. </p><p>Arten er knyttet til elver og bekker og er en nattaktiv jeger som lever av <a href="https://snl.no/virvell%C3%B8se_dyr">virvelløse dyr</a> (invertebrater) den fanger på bakken. </p><p>Den <a href="https://snl.no/formering_-_biologi">formerer</a> seg én gang i året og får som oftest to unger i hvert kull. <a href="https://snl.no/drektighet">Drektighetstiden</a> varer i ca. 15 dager. Ungene blir diet av mora i om lag fire måneder etter fødselen og blir <a href="https://snl.no/kjønnsmodenhet">kjønnsmodne</a> i løpet av to til tre år. </p><p>Levetiden er vanligvis rundt 17 år, men enkelte <a href="https://snl.no/individ_-_biologi">individer</a> kan bli opptil 23 år gamle. </p>'),
('bjørn', '<p><strong>bjørn</strong></p><p>er et stort <a href="https://snl.no/rovpattedyr">rovpattedyr</a> i <a href="https://snl.no/ bj%C3%B8rner">Bjørnefamilien</a> som har sin naturlige utbredelse i Asia, Europa, Nord-Amerika, Midtøsten og Russland. </p><p>Som voksen er den ca. 2,3 meter lang og veier rundt 180 kilo. </p><p>Arten er knyttet til ulike <a href="https://snl.no/habitat">habitater</a>, blant annet <a href="https://snl.no/boreal">boreal</a>, <a href="https://snl.no/subarktisk">subarktisk</a> og <a href="https://snl.no/tempererte_soner">temperert</a> skog, subarktisk, <a href="https://snl.no/boreal">boreal</a> og <a href="https://snl.no/tempererte_soner">temperert</a> buskmark, tørr og fuktig <a href="https://snl.no/tropisk">tropisk</a> buskmark,  <a href="https://snl.no/tundra">tundra</a>, og <a href="https://snl.no/subarktisk">subarktisk</a> og <a href="https://snl.no/tempererte_soner">temperert</a> gressmark. Den er en planteeter som lever av plantedeler og frukt den finner på bakken. </p><p>Den <a href="https://snl.no/formering_-_biologi">formerer</a> seg hvert andre til tredje år og får som oftest to unger i hvert kull. <a href="https://snl.no/drektighet">Drektighetstiden</a> varer i ca. 103 dager. Ungene blir diet av mora i om lag sju måneder etter fødselen og blir <a href="https://snl.no/kjønnsmodenhet">kjønnsmodne</a> i løpet av fire til fem år. </p><p>Den lever vanligvis til den er rundt 44 år gammel. </p>'),
('pungdjevel', '<p><strong>pungdjevel</strong></p><p>er et pattedyr i <a href="https://snl.no/ rovpungdyr">Rovpungdyrfamilien</a> og en av de minste <a href="https://snl.no/rovpungdyr">rovpungdyrene</a> i verden. Den har sin naturlige utbredelse i Australia. </p><p>Som voksen er den ca. 70 cm lang, hannen veier rundt ni kilo og hunnen rundt sju kilo. </p><p>Arten søker etter mat på natta og lever av <a href="https://snl.no/%C3%A5tsel">åtsler</a> den finner på bakken. </p><p>Den <a href="https://snl.no/formering_-_biologi">formerer</a> seg én gang i året og får rundt tre unger i hvert kull. <a href="https://snl.no/drektighet">Drektighetstiden</a> varer i ca. 26 dager. Ungene blir diet av mora i om lag åtte måneder etter fødselen og blir <a href="https://snl.no/kjønnsmodenhet">kjønnsmodne</a> i løpet av to til tre år. </p><p>Levetiden er vanligvis rundt 8 år, men enkelte <a href="https://snl.no/individ_-_biologi">individer</a> kan bli opptil 13 år gamle. </p>');

INSERT INTO loginKeyOnArticle (loginKeyId, articleId, articleNumber) VALUES
	('ABCDEFGHIJKLMNOP', (SELECT articleId FROM ARTICLES LIMIT 1 OFFSET 1) , 1),
	('ABCDEFGHIJKLMNOP', (SELECT articleId FROM ARTICLES LIMIT 1 OFFSET 2), 2),
	('ABCDEFGHIJKLMNOP', (SELECT articleId FROM ARTICLES LIMIT 1 OFFSET 3), 3)

