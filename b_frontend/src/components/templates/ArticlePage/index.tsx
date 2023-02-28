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
    const [clickedWord, setClickedWord] = useState<{index: number, word: string} | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);

    return <>
        <div className="app">
            <div className="side-margin"/>
            <div className="main-content">
                <ArticleRenderer
                    html={props.article.html}
                    onClickWord={word  => {
                        setClickedWord(word);
                    }}
                />
                <button className="fake-link" onClick={() => {
                    if (props.onFinished) props.onFinished(notes);
                }}>Neste</button>
            </div>
            <div className="side-margin"/>
        </div>
        <NoteDialog
            word={clickedWord}
            onSubmitNote={note => {
                setNotes([...notes, note]);
                setClickedWord(null);
            }}
            onCloseDialog={() => setClickedWord(null)}
        />
    </>
}