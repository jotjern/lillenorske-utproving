import { useEffect } from "react";
import "./index.css";

interface ArticleRendererProps {
    html: string;
    onElementClicked?: ({type, index}: {type: "word" | "element", index: number, text: string}) => void;
    wordColors?: Map<number, string>;
}

function is_word(word: string) {
    return !".,!-".includes(word.trim());
}

function separate_words(element: Element): HTMLSpanElement[] {
    /*
    Takes all text nodes in an element and separates them into spans of individual words.
     */

    let words: HTMLSpanElement[] = [];
    console.log("ELEMENT", element);
    let nodes = Array.from(element.childNodes);
    while (nodes.length) {
        const node = nodes.shift();
        if (node === undefined) continue;
        if (node.nodeType === Node.ELEMENT_NODE) {
            nodes = [...nodes, ...Array.from(node.childNodes)];
        }
        console.log("NODE", node);
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
    const id = Math.random().toString(36).substring(2, 9);

    useEffect(() => {
        const article = document.getElementById(id);
        if (article === null) return;
        article.innerHTML = props.html;

        let words: HTMLSpanElement[] = [];
        let segments: Element[] = [];
        article.querySelectorAll("*:not(div)").forEach(elem => {
            words = words.concat(separate_words(elem))
            segments.push(elem);
            elem.addEventListener("click", e => {
                if (e.target !== elem) return;
                if (props.onElementClicked)
                    props.onElementClicked({text: elem.textContent || "", type: "element", index: segments.indexOf(elem)});
            });
        });

        article.querySelectorAll("a").forEach(elem => {
            elem.replaceWith(...Array.from(elem.childNodes));
        });

        article.querySelectorAll("h2").forEach(elem => {
            if (elem.innerText.trim().match(/^Les mer i (Lille|Store) norske leksikon$/i)) {
                elem.nextElementSibling?.remove();
                elem.remove();
                /*
                conso
                elem.nextSibling?.remove();
                elem.remove();
                 */
            }
        });

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (props.wordColors && props.wordColors.has(i))
                word.style.backgroundColor = props.wordColors.get(i) || "";
            word.addEventListener("click", () => {
                if (props.onElementClicked)
                    props.onElementClicked({text: word.textContent || "", type: "word", index: words.indexOf(word)});
            });
        }
    }, []);

    return (
        <div
            className={"article" + (props.onElementClicked ? " highlightable" : "")}
            id={id}/>
    );
}