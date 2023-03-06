import ArticleRenderer from "../../organisms/ArticleRenderer";
import React, {useEffect} from "react";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL;

export default () => {
    const current_page = parseInt((new URLSearchParams(window.location.search)).get("page") ?? "1");
    const [article, setArticle] = React.useState<{article: { title: string, html: string }, heatmap: Map<number, string>} | null>(null);

    useEffect(() => {
        fetch(API_URL + `/admin/articles/${current_page}/notes`, {
            method: "GET",
        }).then(response => {
            if (response.status === 200) {
                response.json().then(json => {
                    let heatmap = new Map<number, number>();
                    for (const note of json["notes"])
                        heatmap.set(note.index, (heatmap.get(note.index) ?? 0) + 1)
                    let colors = new Map<number, string>();
                    let max = Math.max(...Array.from(heatmap.values()));
                    for (const [index, count] of heatmap.entries())
                        colors.set(index, `rgba(255, 0, 0, ${count / max})`);
                    setArticle({article: json["article"], heatmap: colors});
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
                    wordColors={article.heatmap}
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