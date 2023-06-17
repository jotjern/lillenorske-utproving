import React, { useEffect, useState } from 'react';
import ArticlePage from "../../templates/ArticlePage";
import { Note } from "../../organisms/NoteDialog";
import PreKnowledgePage, {PreKnowledge} from "../../templates/PreKnowledgePage";
import ControlPanel from "../../templates/ControlPanel";
import SurveyPage, {Survey} from "../../templates/SurveyPage";
import SuggestionPage, {PageToRank} from "../../templates/SuggestAndRankPage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ThanksPage from "../../templates/ThanksPage";
import LoadingPage from "../../templates/LoadingPage";
import ArticlesDebugPage from "../../templates/ArticlesStatsPage";
import StatsPage from '../../templates/StatsPage';
import PieChart from "../../organisms/PieChart";

interface ImportMetaEnv {
    VITE_API_URL: string;
}

export const API_URL = import.meta.env.VITE_API_URL;

interface Form {
    pre_knowledge: PreKnowledge | null;
    article_notes: Note[] | null;
    survey: Survey | null;
}

interface Article {
    title: string;
    html: string;
    number: number;
}

function App() {
    if (window.location.pathname.startsWith("/controlpanel"))
        return <ControlPanel/>
    if (window.location.pathname.startsWith("/articles"))
        return <ArticlesDebugPage/>
    if (window.location.pathname.startsWith("/stats")) {
        return <StatsPage/>;
    }
    const [article, setArticle] = useState<Article | null>(null);
    const [form, setForm] = useState<Form>({
        pre_knowledge: null,
        article_notes: null,
        survey: null
    });
    const [state, setState] = useState<{
        page: "read" | "suggest" | "thankyou" | "unauthorized", pagesToRank?: PageToRank
    }>({page: "read"});

    const url_code = window.location.search.substring(1).trim();
    if (url_code) {
        fetch(API_URL + "/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({code: url_code})
        }).then(response => {
            if (response.status === 200) {
                setState({page: "read"});
                window.location.href = "/";
            } else {
                setState({page: "unauthorized"});
                window.history.pushState(null, "", "/");
            }
        });

        return <h1>Logging in...</h1>
    }

    useEffect(() => {
        console.log("Form updated:", form);
    }, [form]);

    useEffect(() => {
        if (article) return;

        let has_form = form.pre_knowledge && form.survey && form.article_notes;
        fetch(API_URL + "/state", {
            credentials: "include",
            body: has_form ? JSON.stringify(form) : undefined,
            headers: form ? {
                "Content-Type": "application/json"
            } : {},
            method: has_form ? "POST" : "GET"
        })
            .then(response => {
                if (response.status === 403 || response.status === 401) {
                    window.history.pushState(null, "", "/");
                    setState({page: "unauthorized"});
                } else {
                    return response.json()
                }
            }).then(response => {
                if (!response) return;
                window.history.pushState(null, "", "/");
                if (response["state"] === "read") {
                    setArticle(response["article"]);
                    setState({page: "read"});
                } else if (response["state"] === "suggest") {
                    setState({page: "suggest", pagesToRank: response["articlesToRank"]});
                } else if (response["state"] === "thankyou") {
                    setState({page: "thankyou"});
                }
            });
    }, [article]);

    if (article !== null) {
        const router = createBrowserRouter([
            {
                path: "/",
                element: <PreKnowledgePage article={article} onFinished={preKnowledge => {
                    setForm({...form, pre_knowledge: preKnowledge})
                    window.history.pushState(null, "", "/article");
                }}/>
            },
            {
                path: "/article",
                element: <ArticlePage article={article} onFinished={notes => {
                    setForm({...form, article_notes: notes})
                    window.history.pushState(null, "", "/survey");
                }}/>
            },
            {
                path: "/survey",
                element: <SurveyPage article={article} onFinished={(survey) => {
                    form.survey = survey;
                    window.history.pushState(null, "", "/");
                    setArticle(null);
                }}/>
            }
        ])
        return <RouterProvider router={router}/>
    } else {
        if (state.page === "unauthorized") {
            return <h1>Vennligst bruk linken du har fått</h1>
        } else if (state.page === "suggest") {
            return <SuggestionPage pagesToRank={state.pagesToRank as unknown as PageToRank[]} onFinished={(suggestions, rankings) => {
                fetch(API_URL + "/suggest", {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({suggestions, rankings}),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }).then(() => {
                    setState({page: "thankyou"});
                });
            }}/>
        } else if (state.page === "thankyou") {
            return <ThanksPage/>
        } else if (state.page === "read") {
            return <LoadingPage/>
        }
    }

    return <div>...</div>
}

export default App;
