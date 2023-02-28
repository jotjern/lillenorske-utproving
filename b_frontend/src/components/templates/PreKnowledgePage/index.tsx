import SurveyFrame from "../../organisms/SurveyFrame";
import "./index.css";
import { useState } from "react";
import FakeLink from "../../atoms/FakeLink";

export type PreKnowledge = "none" | "some" | "a lot";

interface PreKnowledgePageProps {
    article: {
        title: string;
        html: string;
        number: number;
    },
    onFinished?: (preKnowledge: PreKnowledge) => void;
}

export default (props: PreKnowledgePageProps) => {
    const [preKnowledge, setPreKnowledge] = useState<PreKnowledge | null>(null);
    return <SurveyFrame>
        <div className="pre-knowledge-page">
            {
                props.article.number === 1 &&
                <p>
                    I spørsmålene du skal svare på finnes det ikke riktige eller
                    feil svar. Det er din vurdering som er viktig for oss.
                </p>
            }
            {
                props.article.number === 2 ?
                    <p>Nå skal du få lese og vurdere en tekst fra Lille norske leksikon om {props.article.title}.</p> :
                    <p>Neste tekst handler om {props.article.title}.</p>
            }
            <p>Hvor mye kan du om {props.article.title}? (kryss av)</p>
            <input type="radio" id="none" name="preKnowledge" value="none" onChange={() => setPreKnowledge("none")}/>
            <label htmlFor="none">Ingenting</label>
            <br/>
            <input type="radio" id="some" name="preKnowledge" value="some" onChange={() => setPreKnowledge("some")}/>
            <label htmlFor="some">Litt</label>
            <br/>
            <input type="radio" id="a lot" name="preKnowledge" value="a lot" onChange={() => setPreKnowledge("a lot")}/>
            <label htmlFor="a lot">Mye</label>
            <br/>
            <br/>
            <br/>

            <FakeLink onClick={() => {
                if (preKnowledge === null) return;
                if (props.onFinished) props.onFinished(preKnowledge);
            }} disabled={preKnowledge === null}>Neste</FakeLink>
        </div>
    </SurveyFrame>
}