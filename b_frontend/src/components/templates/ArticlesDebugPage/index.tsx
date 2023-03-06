import ArticleRenderer from "../../organisms/ArticleRenderer";
import React, {useEffect} from "react";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL;

export default () => {
    const current_page = parseInt((new URLSearchParams(window.location.search)).get("page") ?? "1");
    const [article, setArticle] = React.useState<{
        article: { title: string, html: string },
        wordColors: Map<number, string>,
        elementColors: Map<number, string>
    } | null>(null);

    useEffect(() => {
        fetch(API_URL + `/admin/articles/${current_page}/notes`, {
            method: "GET",
        }).then(response => {
            if (response.status === 200) {
                response.json().then(json => {
                    let word_heatmap = new Map<number, number>();
                    let element_heatmap = new Map<number, number>();
                    for (const note of json["notes"]) {
                        let heatmap = note.type === "word" ? word_heatmap : element_heatmap;
                        let count = heatmap.get(note.index) ?? 0;
                        heatmap.set(note.index, count + 1);
                    }

                    let wordColors = new Map<number, string>();
                    let elementColors = new Map<number, string>();
                    let word_max = Math.max(...Array.from(word_heatmap.values()));
                    let element_max = Math.max(...Array.from(element_heatmap.values()));

                    for (const [key, count] of word_heatmap.entries())
                        wordColors.set(key, `rgba(255, 0, 0, ${count / word_max})`);
                    for (const [key, count] of element_heatmap.entries())
                        elementColors.set(key, `rgba(255, 0, 0, ${count / element_max * 0.5})`);
                    setArticle({article: json["article"], wordColors, elementColors});
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
                    wordColorMap={article.wordColors}
                    elementColorMap={article.elementColors}
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