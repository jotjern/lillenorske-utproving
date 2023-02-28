import SurveyFrame from "../../organisms/SurveyFrame";
import {BeatLoader} from "react-spinners";

export default () => {
    return <SurveyFrame>
        <div style={{margin: "100px 0"}}>
            <BeatLoader size={100}/>
        </div>
    </SurveyFrame>
}