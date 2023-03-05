import { useState } from "react";
import "./index.css";
import FakeLink from "../../atoms/FakeLink";

export type PageToRank = {title: string, articleId: number, articleNumber: number}
export type PageRankings = {likedBest: number | null, easiest: number | null, hardest: number | null};

interface SuggestionsPageProps {
    onFinished?: (suggestions: string, pageRankings: PageRankings) => void;
    pagesToRank: PageToRank[];
}

export default (props: SuggestionsPageProps) => {
    const [suggestions, setSuggestions] = useState<string>("");
    const [rankings, setRankings] = useState<PageRankings>({likedBest: null, easiest: null, hardest: null});

    const hasRankings = rankings.likedBest !== null && rankings.easiest !== null && rankings.hardest !== null;

    if (!hasRankings && props.pagesToRank.length > 1)
        return <div style={{fontSize: "1.6em", margin: "80px 300px"}}>
            <p style={{fontSize: "1.4em"}}>Nå har du lest noen av tekstene fra Lille norske leksikon.</p>
            <p>Hvilken likte du best?</p>
            <div>{props.pagesToRank.map(page => {
                return <label>
                    <input type="radio" name="liked-best" value={page.articleId}/>
                    {page.title}<br/>
                </label>
            })}</div>
            <p>Hvilken var lettest å lese?</p>
            <div>{props.pagesToRank.map(page => {
                return <label>
                    <input type="radio" name="easiest" value={page.articleId}/>
                    {page.title}<br/>
                </label>
            })}</div>
            <p>Hvilken var vanskeligst å lese?</p>
            <div>{props.pagesToRank.map(page => {
                return <label>
                    <input type="radio" name="hardest" value={page.articleId}/>
                    {page.title}<br/>
                </label>
            })}</div>

            <br/>

            <FakeLink onClick={() => {
                const likedBest = parseInt((document.querySelector("input[name='liked-best']:checked") as HTMLInputElement).value);
                const easiest = parseInt((document.querySelector("input[name='easiest']:checked") as HTMLInputElement).value);
                const hardest = parseInt((document.querySelector("input[name='hardest']:checked") as HTMLInputElement).value);

                if (likedBest && easiest && hardest)
                    setRankings({likedBest, easiest, hardest});
            }}>Neste</FakeLink>
        </div>

    return <div className="suggestion-page">
        <br/>
        <br/>
        <p>
            Hvis du fikk bestemme en artikkel til Lille norske leksikon, hva skulle den handle om?
        </p>
        <textarea
            onChange={e => setSuggestions(e.target.value)}
            rows={7}
            value={suggestions}
            placeholder="Skriv inn her..."/>
        <button
            onClick={() => {
            if (props.onFinished)
                props.onFinished(suggestions, rankings)
        }}>Send inn</button>
    </div>
}