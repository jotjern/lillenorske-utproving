import "./index.css";
import FakeLink from "../../atoms/FakeLink";

export type Note = {
    reason: "understanding" | "unnecessary" | "good";
    index: number;
    text: string;
    type: "word" | "element";
}

interface NoteDialogProps {
    element: {
        type: "word" | "element";
        text: string;
        index: number;
    } | null,
    onSubmitNote: (note: Note) => void;
    onCloseDialog?: () => void;
}

export default (props: NoteDialogProps) => {
    if (props.element === null) return null;

    function submitNote(reason: "understanding" | "unnecessary" | "good") {
        if (props.element === null || props.onSubmitNote === undefined) return;
        props.onSubmitNote({
            reason,
            index: props.element.index,
            text: props.element.text,
            type: props.element.type,
        })
    }

    return <div className="note-dialog-container" onClick={e => {
        if (props.onCloseDialog && e.target === e.currentTarget)
            props.onCloseDialog();
    }}>
        <div className="note-dialog">
            <button className="note-dialog-close" onClick={props.onCloseDialog}>X</button>
            <p className="highlighted-segment">{props.element.text}</p>
            <div className="note-dialog-buttons">
                <FakeLink onClick={() => submitNote("understanding")}>Jeg forsto ikke {props.element.type === "word" ? "ordet" : "denne delen"}</FakeLink>
                <br/>
                <FakeLink onClick={() => submitNote("unnecessary")}>Det var unødvendig</FakeLink>
                <br/>
                <FakeLink onClick={() => submitNote("good")}>Dette var bra</FakeLink>
            </div>
        </div>
    </div>
}