import "./index.css";
import FakeLink from "../../atoms/FakeLink";

export type Note = {
    reason: "understanding" | "unnecessary" | "good";
    index: number;
    text: string;
    type: "word" | "paragraph";
}

interface NoteDialogProps {
    word: {
        word: string;
        index: number;
    } | null,
    onSubmitNote: (note: Note) => void;
    onCloseDialog?: () => void;
}

export default (props: NoteDialogProps) => {
    if (props.word === null) return null;

    function submitNote(reason: "understanding" | "unnecessary" | "good") {
        if (props.word === null || props.onSubmitNote === undefined) return;
        props.onSubmitNote({
            reason,
            index: props.word.index,
            text: props.word.word,
            type: "word"
        })
    }

    return <div className="note-dialog-container" onClick={e => {
        if (props.onCloseDialog && e.target === e.currentTarget)
            props.onCloseDialog(); }
    }>
        <div className="note-dialog">
            <button className="note-dialog-close" onClick={props.onCloseDialog}>X</button>
            <br/>
            <p className="highlighted-segment">{props.word.word}</p>
            <div className="note-dialog-buttons">
                <FakeLink onClick={() => submitNote("understanding")}>Jeg forsto ikke ordet</FakeLink>
                <br/>
                <FakeLink onClick={() => submitNote("unnecessary")}>Det var unødvendig</FakeLink>
                <br/>
                <FakeLink onClick={() => submitNote("good")}>Dette var bra</FakeLink>
            </div>
        </div>
    </div>
}