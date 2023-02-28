import "./index.css";

interface EmojiChoiceProps {
    emojis: Map<string, string>;
    onChoice: (emoji: string) => void;
    selectedEmoji?: string;
}

export default (props: EmojiChoiceProps) => {
    return <div className="emoji-choice">
        {
            Array.from(props.emojis.entries()).map(([emoji, value]) => {
                return <div className="emoji-choice-item" key={emoji}>
                    <button onClick={() => props.onChoice(value)} className={props.selectedEmoji === value ? "emoji selected-emoji" : "emoji"}>
                        <span role="img" aria-label={value}>{emoji}</span>
                    </button>
                </div>
            })
        }
    </div>
}