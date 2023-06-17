import ArticleRenderer from "../../organisms/ArticleRenderer";
import React, { useEffect } from "react";
import "./index.css";
import PieChart from "../../organisms/PieChart";

const API_URL = import.meta.env.VITE_API_URL;

const translations = {
    difficulty: "Hvor vanskelig",
    hard: "Veldig vanskelig",
    medium: "Passe vanskelig",
    easy: "Lett",

    learnedSomething: "Lærte noe",
    yes: "Ja",
    no: "Nei",

    preknowledge: "Hva kunne du fra før",
    none: "Ingenting",
    some: "Litt",
    "a lot": "Mye",

    rating: "Vurdering av tekst",
    good: "🤩",
    ok: "😐",
    bad: "😡",

    suitableAge: "Passende alder",
    small_children: "Småbarn",
    adult: "Voksne"
} as {[p: string]: string};

function norwegian_reason(reason: string) {
    switch (reason) {
        case "understanding":
            return "Vanskelig";
        case "unnecessary":
            return "Unødvendig";
        case "good":
            return "Bra";
        default:
            return reason;
    }
}

function translateData(data: {[p: string]: number}, translations: {[p: string]: string}): {[p: string]: number} {
    const translatedData: {[key: string]: number} = {};

    for (const key in data) {
        if (translations[key]) {
            const translatedKey = translations[key];
            translatedData[translatedKey] = data[key];
        } else {
            translatedData[key] = data[key];
        }
    }

    return translatedData;
}

interface ArticleNotesPageResponse {
    article: {
        articleId: number,
        html: string,
        title: string
    },
    notes: Note[],
    feedback: {
        [metric: string]: {[value: string]: number}
    }
}

interface Note {
    index: number;
    reason: "understanding" | "unnecessary" | "good";
    type: "word" | "element";
    text: string;
}

const processNotes = (notes: Note[], filter: {understanding: boolean, unnecessary: boolean, good: boolean}, max: number = 1): { indexColors: Map<number, string>; reasonCountStrings: Map<number, string> } => {
    const indexCount: Map<number, number> = new Map();
    const indexReasonCount: Map<number, Map<string, number>> = new Map();

    notes.forEach((note) => {
        if (filter[note.reason])
            indexCount.set(note.index, (indexCount.get(note.index) || 0) + 1);

        if (!indexReasonCount.has(note.index)) {
            indexReasonCount.set(note.index, new Map());
        }
        const reasonCount = indexReasonCount.get(note.index)!;
        reasonCount.set(note.reason, (reasonCount.get(note.reason) || 0) + 1);
    });

    // Normalize index counts
    const maxCount = Math.max(...Array.from(indexCount.values()));
    const minCount = Math.min(...Array.from(indexCount.values()));
    const normalizedIndexCount: Map<number, number> = new Map();

    for (const [index, count] of indexCount.entries()) {
        normalizedIndexCount.set(index, ((count - minCount) / (maxCount - minCount)));
    }

    // Generate color based on normalized index count
    const generateColor = (value: number): string => {
        const alpha = value * max;
        return `rgba(255, 0, 0, ${alpha})`;
    };

    const indexColors: Map<number, string> = new Map();

    for (const [index, value] of normalizedIndexCount.entries()) {
        indexColors.set(index, generateColor(value));
    }

    // Create the reason count strings
    const reasonCountStrings: Map<number, string> = new Map();

    for (const [index, reasonCount] of indexReasonCount.entries()) {
        reasonCountStrings.set(
            index,
            Array.from(reasonCount.entries())
                .filter(([reason, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => `${norwegian_reason(reason)}: ${count}`)
                .join('\n')
        );
    }

    return {
        indexColors,
        reasonCountStrings,
    };
};

export default () => {
    const current_page = parseInt((new URLSearchParams(window.location.search)).get("page") ?? "1");
    const [article, setArticle] = React.useState<{
        article: { title: string; html: string };
        wordColors: Map<number, string>;
        elementColors: Map<number, string>;
        wordText: Map<number, string>;
        elementText: Map<number, string>;
        feedback: {[p: string]: {[p: string]: number}}
    } | null>(null);
    const [filter, setFilter] = React.useState<{ understanding: boolean; unnecessary: boolean; good: boolean }>({
        understanding: true,
        unnecessary: true,
        good: true,
    });

    useEffect(() => {
        // Don't crash on wrong status
        fetch(API_URL + `/admin/articles/${current_page}/notes`, {
            method: "GET",
        }).then((response) => {
            if (response.status === 200) {
                response.json().then((data: ArticleNotesPageResponse) => {
                    let word_reasons = new Map<string, number>();
                    let element_reasons = new Map<string, number>();

                    const word_notes = data.notes.filter((note) => note.type === "word");
                    const element_notes = data.notes.filter((note) => note.type === "element");

                    const {
                        indexColors: wordColors, reasonCountStrings: wordText
                    } = processNotes(word_notes, filter);

                    const {
                        indexColors: elementColors, reasonCountStrings: elementText
                    } = processNotes(element_notes, filter, 0.5);

                    setArticle({ article: data["article"], wordColors, elementColors, wordText, elementText, feedback: data.feedback });
                });
            } else {
                window.history.pushState({}, "", "/articles?page=0");
                setArticle(null);
            }
        });
    }, [current_page, filter]);

    return (
        <div className="app">
            {
                article && <div style={{position: "absolute", right: 0, top: "18px", width: "18vw"}}>
                {
                    Object.entries(article.feedback).map(([metric, data]) =>
                        <PieChart data={translateData(data, translations)} title={translations[metric] || metric}/>
                    )
                }
            </div>
            }
            <div className="filter">
                <label>
                    <input
                        type="checkbox"
                        checked={filter.understanding}
                        onChange={(event) => setFilter({ ...filter, understanding: event.target.checked })}
                    />
                    Vanskelig
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={filter.unnecessary}
                        onChange={(event) => setFilter({ ...filter, unnecessary: event.target.checked })}
                    />
                    Unødvendig
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={filter.good}
                        onChange={(event) => setFilter({ ...filter, good: event.target.checked })}
                    />
                    Bra
                </label>
            </div>
            <div className="side-margin" />
            <div className="main-content">
                <button
                    className="fake-link"
                    onClick={() => {
                        if (current_page === 0) return;
                        window.history.pushState({}, "", "/articles?page=" + (current_page - 1));
                        setArticle(null);
                    }}
                >
                    Tilbake
                </button>
                <button
                    className="fake-link"
                    onClick={() => {
                        if (current_page === 20) return;
                        window.history.pushState({}, "", "/articles?page=" + (current_page + 1));
                        setArticle(null);
                    }}
                >
                    Neste
                </button>
                <button
                    className="fake-link"
                    style={{float: "right"}}
                    onClick={() => {
                        window.location.href = "/stats";
                    }}
                >
                    Statistikk
                </button>
                {article && (
                    <ArticleRenderer
                        article={{ html: article.article.html, title: article.article.title }}
                        wordColor={article.wordColors}
                        elementColor={article.elementColors}
                        wordText={article.wordText}
                        elementText={article.elementText}
                    />
                )}
            </div>
            <div className="side-margin" />
        </div>
    );
};