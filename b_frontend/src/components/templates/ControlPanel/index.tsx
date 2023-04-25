import React, {useEffect, useState} from 'react';
import "./index.css";

interface ControlPanelStats {
    state: {
        sessions: number;
        articles: number;
        reviews: number;
        reviewNotes: number;
        suggestionsAndRankings: number;
    },
    schoolStats: {
        schoolName: string;
        grade: number;
        count: number;
    }[]
}

const API_URL = import.meta.env.VITE_API_URL;

export default () => {
    const [stats, setStats] = useState<ControlPanelStats | null>(null);

    const fetchStats = async () => await (await fetch(API_URL + "/admin/controlpanel", {
        method: "POST",
        body: JSON.stringify({password: window.location.search.substring(1)}),
        headers: {
            "Content-Type": "application/json"
        }
    })).json();
    useEffect(() => {
        fetchStats().then(setStats);
        const interval = setInterval(() => fetchStats().then(setStats), 1000);
        return () => clearInterval(interval);
    }, []);

    return <div className="control-panel">
        <div className="side-margin"/>
        <div className="main-content">
            <h1>Statistikk</h1>
            <table>
                <tbody>
                    <tr>
                        <td>
                            <h2>Brukere</h2>
                            <p>{stats?.state.sessions ?? '...'}</p>
                        </td>
                        <td>
                            <h2>Artikler</h2>
                            <p>{stats?.state.articles ?? '...'}</p>
                        </td>
                        <td>
                            <h2>Artikler lest</h2>
                            <p>{stats?.state.reviews ?? '...'}</p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <h2>Merknader</h2>
                            <p>{stats?.state.reviewNotes ?? '...'}</p>
                        </td>
                        <td>
                            <h2>Forslag & rangeringer</h2>
                            <p>{stats?.state.suggestionsAndRankings ?? '...'}</p>
                        </td>
                    </tr>
                </tbody>
            </table>
            <br/>
            <button className="emergency-button" onClick={() => {
                if (!confirm("Er du sikker på at du vil omstarte alt?")) return;
                fetch(API_URL + "/admin/emergencyreset", {
                    method: "POST",
                    body: JSON.stringify({token: window.location.search.substring(1)}),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }).then(() => {
                    window.location.reload();
                });
            }}>Omstart alt</button>
            <h1>Skoler/klasser</h1>
            <table>
                <tbody>
                {
                    stats?.schoolStats.map((schoolStat, index) => (
                        <tr key={schoolStat.schoolName}>
                            <td>
                                <h2>Skole</h2>
                                <p>{schoolStat.schoolName ?? '...'}</p>
                            </td>
                            <td>
                                <h2>Klasse</h2>
                                <p>{schoolStat.grade ?? '...'}</p>
                            </td>
                            <td>
                                <h2>Antall brukere</h2>
                                <p>{schoolStat.count ?? '...'}</p>
                            </td>
                        </tr>
                    ))
                }
                </tbody>
            </table>
        </div>
        <div className="side-margin"/>
    </div>
}