import "./index.css";

interface FakeLinkProps {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}
export default (props: FakeLinkProps) => {
    return <button disabled={props.disabled} className="fake-link" onClick={() => {
        if (props.disabled) return;
        props.onClick();
    }}>{props.children}</button>
}