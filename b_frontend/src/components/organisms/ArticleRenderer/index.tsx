import { useEffect } from "react";
import "./index.css";

interface ArticleRendererProps {
    article: {html: string, title: string};
    onElementClicked?: ({type, index}: {type: "word" | "element", index: number, text: string}) => void;
    wordColorMap?: Map<number, string>;
    elementColorMap?: Map<number, string>;
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
    const id = Math.random().toString(36).substring(2, 9);

    console.log(props);

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
        console.log(first_paragraph);
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
            if (props.elementColorMap && props.elementColorMap.has(i))
                elem.setAttribute("style", `background-color: ${props.elementColorMap.get(i)}`);
            elem.addEventListener("click", e => {
                if (e.target !== elem) return;
                if (props.onElementClicked)
                    props.onElementClicked({text: elem.textContent || "", type: "element", index: segments.indexOf(elem)});
            });
        });

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            console.log(props.wordColorMap?.get(i));
            if (props.wordColorMap && props.wordColorMap.has(i))
                word.setAttribute("style", `background-color: ${props.wordColorMap.get(i)}`);
            word.addEventListener("click", () => {
                if (props.onElementClicked)
                    props.onElementClicked({text: word.textContent || "", type: "word", index: words.indexOf(word)});
            });
        }
    }, [props.wordColorMap, props.elementColorMap]);

    return (
        <div
            className={"article" + (props.onElementClicked ? " highlightable" : "")}
            id={id}/>
    );
}