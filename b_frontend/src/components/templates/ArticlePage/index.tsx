import React, {useState} from "react";
import NoteDialog, {Note} from "../../organisms/NoteDialog";
import ArticleRenderer from "../../organisms/ArticleRenderer";
import "./index.css"

interface ArticlePageProps {
    article: {
        title: string;
        html: string;
    },
    onFinished?: (notes: Note[]) => void;
}

export default (props: ArticlePageProps) => {
    const [clickedElement, setClickedElement] = useState<{type: "word" | "element", index: number, text: string} | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);

    const wordColorMap = new Map<number, string>();
    const elementColorMap = new Map<number, string>();
    for (const note of notes) {
        if (note.type === "word")
            wordColorMap.set(note.index, "rgba(255,255,0,1)");
        else
            elementColorMap.set(note.index, "rgba(255,255,0,0.5)");
    }

    console.log(wordColorMap);

    return <>
        <div className="app">
            <div className="side-margin"/>
            <div className="main-content">
                <ArticleRenderer
                    article={props.article}
                    onElementClicked={element => setClickedElement(element)}
                    wordColorMap={wordColorMap}
                    elementColorMap={elementColorMap}
                />
                <button className="fake-link" onClick={() => {
                    if (props.onFinished) props.onFinished(notes);
                }}>Neste</button>
            </div>
            <div className="side-margin"/>
        </div>
        <br/>
        <NoteDialog
            element={clickedElement}
            onSubmitNote={note => {
                setNotes([...notes, note]);
                setClickedElement(null);
            }}
            onCloseDialog={() => setClickedElement(null)}
        />
    </>
}