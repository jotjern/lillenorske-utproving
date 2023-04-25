import {useEffect, useState} from "react";
import "./index.css";

interface ArticleRendererProps {
    article: {html: string, title: string};
    onElementClicked?: ({type, index}: {type: "word" | "element", index: number, text: string}) => void;
    wordColor?: Map<number, string>;
    elementColor?: Map<number, string>;
    wordText?: Map<number, string>;
    elementText?: Map<number, string>;
}

function is_word(word: string) {
    return !".,!-".includes(word.trim());
}

function separate_words(element: Element): HTMLSpanElement[] {
    /*
    Takes all text nodes in an element and separates them into spans of individual words.
     */

    let words: HTMLSpanElement[] = [];
    let nodes = Array.from(element.childNodes);
    while (nodes.length) {
        const node = nodes.shift();
        if (node === undefined) continue;
        if (node.nodeType === Node.ELEMENT_NODE) {
            nodes = [...nodes, ...Array.from(node.childNodes)];
        }
        if (node.parentElement !== null && node.parentElement.classList.contains("word")) continue;
        if (node.nodeType === Node.TEXT_NODE && node.textContent !== null) {
            const node_words = node.textContent.split(" ");
            let nodes = [];
            for (let i = 0; i < node_words.length; i++) {
                const span = document.createElement("span");
                span.classList.add("word");
                let word = node_words[i];
                let outside_word = i < node_words.length - 1 ? " " : "";
                if (word.endsWith(".") || word.endsWith(",") || word.endsWith("!") || word.endsWith("?")) {
                    outside_word = word.slice(-1) + outside_word;
                    word = word.slice(0, -1);
                }
                span.textContent = word;
                nodes.push(span);
                words.push(span);

                if (outside_word) {
                    const span = document.createElement("span");
                    span.innerText = outside_word;
                    nodes.push(span);
                }
            }

            node.replaceWith(...nodes);
        }
    }

    return words;
}

export default (props: ArticleRendererProps) => {
    const [infoText, setInfoText] = useState<[string | null, string | null]>([null, null]);

    const id = Math.random().toString(36).substring(2, 9);

    useEffect(() => {
        const article = document.getElementById(id);
        if (article === null) return;
        article.innerHTML = props.article.html;

        article.querySelectorAll("a").forEach(elem => {
            elem.replaceWith(...Array.from(elem.childNodes));
        });

        article.querySelectorAll("h2").forEach(elem => {
            if (elem.innerText.trim().match(/^Les mei?r i (Lille|Store|Vesle) norske leksikon$/i)) {
                elem.nextElementSibling?.remove();
                elem.remove();
            }
        });

        const first_paragraph = article.querySelector("p");
        if (first_paragraph !== null) {
            if (first_paragraph.innerText.startsWith("var ") || first_paragraph.innerText.startsWith("er")) {
                const capitalized_title = props.article.title.charAt(0).toUpperCase() + props.article.title.slice(1);
                first_paragraph.insertBefore(document.createTextNode(capitalized_title + " "), first_paragraph.firstChild);
            }
        }

        let words: HTMLSpanElement[] = [];
        let segments: Element[] = [];

        article.querySelectorAll("*:not(div)").forEach((elem, i) => {
            words = words.concat(separate_words(elem))
            segments.push(elem);
            if (props.elementColor && props.elementColor.has(i))
                elem.setAttribute("style", `background-color: ${props.elementColor.get(i)}`);
            elem.addEventListener("click", e => {
                if (e.target !== elem) return;
                if (props.onElementClicked)
                    props.onElementClicked({text: elem.textContent || "", type: "element", index: segments.indexOf(elem)});
            });
            if (props.elementText !== undefined && props.elementText.has(i)) {
                const hoverText = props.elementText.get(i) || "";
                elem.addEventListener("mouseover", e => {
                    if (e.target !== elem) return;
                    setInfoText([infoText[0], hoverText]);
                })
                elem.addEventListener("mouseout", e => {
                    if (e.target !== elem) return;
                    setInfoText([null, null]);
                });
            }
        });

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (props.wordColor && props.wordColor.has(i))
                word.setAttribute("style", `background-color: ${props.wordColor.get(i)}`);
            if (props.wordText && props.wordText.has(i)) {
                const hoverText = props.wordText.get(i) || "";
                word.addEventListener("mouseover", e => {
                    if (e.target !== word) return;
                    setInfoText([hoverText, infoText[1]]);
                });
                word.addEventListener("mouseout", e => {
                    if (e.target !== word || infoText[0] !== hoverText) return;
                    setInfoText([null, infoText[1]]);
                });
            }
            word.addEventListener("click", () => {
                if (props.onElementClicked)
                    props.onElementClicked({text: word.textContent || "", type: "word", index: words.indexOf(word)});
            });
        }
    }, [props.wordColor, props.elementColor]);

    const selectedInfoText = infoText[0] ?? infoText[1];

    return (
        <div>
            {
                selectedInfoText && <div className="info-text">
                    {(selectedInfoText ?? "").split("\n").map((line, index) => (
                        <div key={index}>{line}</div>
                    ))}
                </div>
            }
            <div
                className={"article" + ((props.onElementClicked || props.elementText || props.wordText) ? " highlightable" : "")}
                id={id}/>
        </div>
    );
}