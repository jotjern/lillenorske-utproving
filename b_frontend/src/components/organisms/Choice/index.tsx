import "./index.css";

interface ChoiceProps {
    choices: Map<string, string>;
    onChoice: (choice: string) => void;
    selectedChoice?: string;
}

export default (props: ChoiceProps) => {
    const name = Math.random().toString(36).substring(7);
    return <div className="choice">
        {
            Array.from(props.choices.entries()).map(([choice, value]) => {
                return <div className={props.selectedChoice === value ? "choice-item selected-choice" : "choice-item"} key={choice}>
                    <label>
                        <input type="radio" name={name} value={value} checked={props.selectedChoice === value} onChange={() => props.onChoice(value)}/>
                        {choice}
                    </label>
                </div>
            })
        }
    </div>
}