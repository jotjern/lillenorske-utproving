import ArticleRenderer from "../../organisms/ArticleRenderer";
import React, {useEffect} from "react";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL;

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

export default () => {
    const current_page = parseInt((new URLSearchParams(window.location.search)).get("page") ?? "1");
    const [article, setArticle] = React.useState<{
        article: { title: string, html: string },
        wordColors: Map<number, string>,
        elementColors: Map<number, string>,
        wordText: Map<number, string>,
        elementText: Map<number, string>
    } | null>(null);

    useEffect(() => {
        fetch(API_URL + `/admin/articles/${current_page}/notes`, {
            method: "GET",
        }).then(response => {
            if (response.status === 200) {
                response.json().then(json => {
                    let word_heatmap = new Map<number, number>();
                    let element_heatmap = new Map<number, number>();

                    let word_reasons = new Map<number, Map<string, number>>();
                    let element_reasons = new Map<number, Map<string, number>>();

                    for (const note of json["notes"]) {
                        let heatmap = note.type === "word" ? word_heatmap : element_heatmap;
                        let reasons = note.type === "word" ? word_reasons : element_reasons;
                        let count = heatmap.get(note.index) ?? 0;
                        heatmap.set(note.index, count + 1);

                        let reason_count = reasons.get(note.index) ?? new Map<string, number>();
                        reason_count.set(note.reason, (reason_count.get(note.reason) ?? 0) + 1);
                        reasons.set(note.index, reason_count);
                    }

                    let wordColors = new Map<number, string>();
                    let elementColors = new Map<number, string>();
                    let word_max = Math.max(...Array.from(word_heatmap.values()));
                    let element_max = Math.max(...Array.from(element_heatmap.values()));
                    let wordText = new Map<number, string>();
                    let elementText = new Map<number, string>();

                    for (const [key, count] of word_heatmap.entries()) {
                        wordColors.set(key, `rgba(255, 0, 0, ${count / word_max})`);
                        const reason = word_reasons.get(key) ?? new Map<string, number>();
                        wordText.set(key, "Merknader på ord:\n" + Array.from(reason.entries()).map(([reason, count]) => `${norwegian_reason(reason)}: ${count}`).join("\n"));
                    }
                    for (const [key, count] of element_heatmap.entries()) {
                        const reason = word_reasons.get(key) ?? new Map<string, number>();
                        elementColors.set(key, `rgba(255, 0, 0, ${count / element_max * 0.5})`);
                        elementText.set(key, "Merknader på element:\n" + Array.from(reason.entries()).map(([reason, count]) => `${norwegian_reason(reason)}: ${count}`).join("\n"));
                    }

                    setArticle({article: json["article"], wordColors, elementColors, wordText, elementText});
                });
            }
        });
    }, [current_page]);

    return <div className="app">
        <div className="side-margin"/>
        <div className="main-content">
            {
                article && <ArticleRenderer
                    article={{html: article.article.html, title: article.article.title}}
                    wordColor={article.wordColors}
                    elementColor={article.elementColors}
                    wordText={article.wordText}
                    elementText={article.elementText}
                />
            }
            <button className="fake-link" onClick={() => {
                window.location.href = "/articles?page=" + (current_page - 1);
            }}>Tilbake</button>
            <button className="fake-link" onClick={() => {
                window.location.href = "/articles?page=" + (current_page + 1);
            }}>Neste</button>
        </div>
        <div className="side-margin"/>
    </div>
}