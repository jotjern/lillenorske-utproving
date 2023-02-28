import EmojiChoice from "../../organisms/EmojiChoice";
import { useState } from "react";
import Choice from "../../organisms/Choice";
import FakeLink from "../../atoms/FakeLink";
import SurveyFrame from "../../organisms/SurveyFrame";
import "./index.css";

export type Difficulty = "easy" | "medium" | "hard";
export type Rating = "bad" | "ok" | "good";
export type SuitableAge = "small_children" | "8-9" | "10-11" | "12-13" | "adult";
export type LearnedSomething = "yes" | "no";

export interface Survey {
    difficulty: Difficulty;
    suitable_age: SuitableAge;
    rating: Rating;
    learned_something: LearnedSomething;
    skip: boolean;
}

export interface SurveyPageProps {
    article: {
        html: string;
        title: string;
        number: number;
    },
    onFinished?: (survey: Survey) => void;
}

export default (props: SurveyPageProps) => {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [suitable_age, setSuitable_age] = useState<SuitableAge | null>(null);
    const [rating, setRating] = useState<Rating | null>(null);
    const [learned_something, set_learned_something] = useState<LearnedSomething | null>(null);

    return <SurveyFrame>
        <div className="survey">
            <p>Hvor vanskelig tror du teksten vil være for de som er ett år yngre enn deg?</p>
            <Choice
                choices={new Map([
                    ["Veldig vanskelig", "hard"],
                    ["Passe vanskelig", "medium"],
                    ["Lett", "easy"]
                ])}
                onChoice={choice => setDifficulty(choice as Difficulty)}
                selectedChoice={difficulty ?? undefined}/>
            <p>Hvem passer teksten for?</p>
            <Choice
                choices={new Map([
                    ["Småbarn", "small_children"],
                    ["8-9 åringer", "8-9"],
                    ["10-11 åringer", "10-11"],
                    ["12-13 åringer", "12-13"],
                    ["Voksne", "adult"]
                ])}
                onChoice={choice => setSuitable_age(choice as SuitableAge)}
                selectedChoice={suitable_age ?? undefined}/>

            <p>Hva syntes du om teksten?</p>
            <EmojiChoice
                emojis={new Map([
                    ["😡", "bad"],
                    ["😐", "ok"],
                    ["🤩", "good"]
                ])}
                onChoice={choice => setRating(choice as Rating)}
                selectedEmoji={rating ?? undefined}/>
            <p>Lærte du noe nytt om {props.article.title}?</p>
            <EmojiChoice
                emojis={new Map([
                    ["👍", "yes"],
                    ["👎", "no"]
                ])}
                onChoice={choice => set_learned_something(choice as LearnedSomething)}
                selectedEmoji={learned_something ?? undefined}/>

            <FakeLink
                onClick={() => {
                    if (difficulty === null || suitable_age === null || rating === null || learned_something === null) return;
                    if (props.onFinished) props.onFinished({
                        difficulty, suitable_age, rating, learned_something, skip: false
                    });
                }}
                disabled={difficulty === null || suitable_age === null || rating === null || learned_something === null}>
                Neste
            </FakeLink>
            <br/>
            {
                props.article.number === 2 && <FakeLink
                    onClick={() => {
                        if (difficulty === null || suitable_age === null || rating === null || learned_something === null) return;
                        if (props.onFinished) props.onFinished({
                            difficulty, suitable_age, rating, learned_something, skip: true
                        });
                    }}
                    disabled={difficulty === null || suitable_age === null || rating === null || learned_something === null}>
                    Hopp til slutt
                </FakeLink>
            }
        </div>
    </SurveyFrame>
}