import { useEffect, useRef } from "react";

interface BarChartProps {
    data: {
        label: string;
        value: number;
    }[],
    color?: string;
    spacing?: number;
    margin?: number;
    size?: {
        width: number;
        height: number;
    };
    title?: string;
    fontScale?: number;
}

export default function BarChart(props: BarChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (canvas) {
            const margin = props.margin ?? 200;
            const width = canvas.width - margin * 2;
            const height = canvas.height - margin;

            const ctx = canvas.getContext("2d");

            const barSpace = width / props.data.length;
            const barSpacing = props.spacing ?? 2;

            const highestValue: number = Math.max(...props.data.map(({value}) => value));
            const lowestValue: number = Math.min(...props.data.map(({value}) => value));

            // const scale = (value: number) => ((value - lowestValue) / (highestValue - lowestValue)) * height;
            const scale = (value: number) => (value / highestValue) * height;

            if (ctx) {
                ctx.fillStyle = props.color ?? "black";
                for (let i = 0; i <= 10; i++) {
                    const value = Math.round(highestValue / 10 * i);
                    const y = height - scale(value) + margin;

                    ctx.font = `${(props.fontScale ?? 1) * 60}px Arial`;
                    ctx.fillStyle = "black";
                    ctx.textAlign = "center";
                    ctx.fillText(value.toString(), margin / 2, y - 10);
                    ctx.fillRect(0, y, canvas.width, 1);
                }

                for (const [index, {label, value}] of props.data.entries()) {
                    const x = index * barSpace + barSpacing + margin;
                    const y = height - scale(value) + margin;
                    const w = barSpace - barSpacing * 2;
                    const h = scale(value);

                    ctx.fillStyle = props.color ?? "black";
                    ctx.fillRect(x, y, w, h);
                    ctx.strokeStyle = "black";
                    ctx.strokeRect(x, y, w, h);
                }

                for (const [index, {label, value}] of props.data.entries()) {
                    const x = index * barSpace + barSpacing + margin;
                    const y = height - scale(value) + margin;
                    const w = barSpace - barSpacing * 2;

                    ctx.fillStyle = "black";
                    ctx.font = `${(props.fontScale ?? 1) * 60}px Arial`;
                    ctx.save();
                    ctx.translate(x + w / 2 + 10, y - 30);
                    ctx.rotate(-Math.PI / 8);
                    ctx.textAlign = "center";
                    for (const [index, line] of label.split("\n").entries()) {
                        ctx.fillText(line, 0, index * 60);
                    }
                        
                    ctx.restore();
                } 
            }
        }
    }, [props.data]);

    return <div style={{display: "inline-block", "verticalAlign": "top", "margin": "20px"}}>
        <h2 style={{textAlign: "center"}}>{props.title ?? "Bar chart"}</h2>
        <canvas
            id="myChart"
            width={1600}
            height={1600 * (props.size?.height ?? 800) / (props.size?.width ?? 800)}
            style={{
                width: `${props.size?.width ?? 800}px`,
                height: `${props.size?.height ?? 800}px`,
                border: "1px solid black"
            }}
            ref={canvasRef}/
        >
    </div>
}