import { useEffect, useState } from "react";
import { API_URL } from "../../pages/App";

import BarChart from "../../organisms/BarChart";
import FakeLink from "../../atoms/FakeLink";

import "./index.css";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import PieChart from "../../organisms/PieChart";

function reasonText(reason: "understanding" | "unnecessary" | "good") {
    switch (reason) {
        case "understanding":
            return "Vanskelig";
        case "unnecessary":
            return "Unødvendig";
        case "good":
            return "Bra";
    }
}
  
interface Stats {
    mostReportedWords: {
        count: string,
        articleid: number,
        index: number,
        reason: "understanding" | "unnecessary" | "good",
        text: string
    }[],
    mostReportedElements: {
        count: string,
        articleid: number,
        index: number,
        reason: "understanding" | "unnecessary" | "good",
        text: string
    }[],
    articleRatings: {
        articleid: number,
        title: string,
        likedbestcount: string,
        easiestcount: string,
        hardestcount: string
    }[],
    aggregatedNotes: {
        count: string,
        articleid: number,
        index: number,
        reason: "understanding" | "unnecessary" | "good",
        text: string
    }[],
    noteCategoryCounts: {
        count: string,
        reason: "understanding" | "unnecessary" | "good",
        type: "word" | "element"
    }[],
    popularSuggestions: {
        suggestion: string,
        count: string
    }[];
    allSuggestions: string[];
}

export default function StatsPage() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            const response = await fetch(API_URL + "/endstats");
            const stats = await response.json();
            setStats(stats);
        };

        fetchStats();
    }, []);

    if (stats === null)
        return <div>Loading...</div>;

    const popularSuggestionData = stats.popularSuggestions
        .slice(0, 10)
        .map(suggestion => ({
            label: suggestion.suggestion,
            value: parseInt(suggestion.count)
        }));

    let noteTypeData = stats.noteCategoryCounts.map(noteType => ({
        label: reasonText(noteType.reason) + (noteType.type === "word" ? " ord" : " avsnitt"),
        value: parseInt(noteType.count)
    }));
    noteTypeData.sort((a, b) => b.value - a.value);

    let hardestArticles = stats.articleRatings.map(article => ({
        label: article.title,
        value: parseInt(article.hardestcount)
    }));
    hardestArticles.sort((a, b) => b.value - a.value);

    let easiestArticles = stats.articleRatings.map(article => ({
        label: article.title,
        value: parseInt(article.easiestcount)
    }));
    easiestArticles.sort((a, b) => b.value - a.value);

    let likedBestArticles = stats.articleRatings.map(article => ({
        label: article.title,
        value: parseInt(article.likedbestcount) || 0
    }));
    likedBestArticles.sort((a, b) => b.value - a.value);

    console.log(stats.mostReportedWords);

    let mostReportedDifficultWords = stats.mostReportedWords
        .filter(word => word.reason === "understanding")
        .map(word => ({
        label: word.text,
        value: parseInt(word.count)
    })).slice(0, 10);


    return <div>
        <FakeLink onClick={() => {
            window.location.href = "/articles";
        }}>Artikler</FakeLink>
        <br/>
        <BarChart
            data={popularSuggestionData}
            size={{width: 400, height: 400}}
            spacing={8}
            title="Populære artikkelforslag"
            color="green"
            />
        <BarChart
            data={noteTypeData}
            size={{width: 400, height: 400}}
            spacing={16}
            title="Typer merknader"
            color="orange"
            />
        <BarChart
            data={mostReportedDifficultWords}
            size={{width: 400, height: 400}}
            spacing={16}
            title="Vanskeligste ord"
            color="red"
            />
        <br/>
        <BarChart
            data={hardestArticles}
            size={{width: 1200, height: 400}}
            spacing={4}
            title="Vanskeligste artikler"
            color="yellow"
            fontScale={0.4}
            />
        <BarChart
            data={easiestArticles}
            size={{width: 1200, height: 400}}
            spacing={4}
            title="Enkleste artikler"
            color="lightblue"
            fontScale={0.4}
            />
        <BarChart
            data={likedBestArticles}
            size={{width: 1200, height: 400}}
            spacing={4}
            title="Beste artikler"
            color="lime"
            fontScale={0.4}
            />
        <div className="suggestions-container">
            <h1>Forslag til artikler</h1>
            <table className="suggestions-table">
                <thead>
                    <tr>
                        <th>Forslag</th>
                        <th>Antall</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.popularSuggestions.map(({suggestion, count}) => <tr>
                        <td>
                            {suggestion}
                        </td>
                        <td>{count}</td>
                    </tr>)
                    }
                </tbody>
            </table>
        </div>
    </div>
}