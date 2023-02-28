import SNLLogo from "../../molecules/SNLLogo";
import "./index.css";

interface SurveyFrameProps {
    children: React.ReactNode;
}

export default (props: SurveyFrameProps) => {
    return <div className="survey-frame">
        <div>
            <SNLLogo width="400" height="400"/>
        </div>
        <div className="survey-frame-content">
            {props.children}
        </div>
    </div>
}