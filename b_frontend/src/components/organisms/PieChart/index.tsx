import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface PieChartProps {
    data: { [category: string]: number };
    title: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, title}) => {
    // Generate colors from HSV color space evenly distributed with max saturation and value
    const colors = Array.from(Array(Object.keys(data).length).keys()).map((i) =>
        `hsl(${(i * 360) / Object.keys(data).length}, 70%, 50%)`);
    let highchartsOptions = {
        chart: {
            type: "pie",
            margin: [0, 0, 0, 0], // Set margins to remove whitespace
            spacingTop: 0, // Set spacing to remove whitespace
            spacingBottom: 0, // Set spacing to remove whitespace
        },
        plotOptions: {
            pie: {
                animation: false,
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true, // Set dataLabels enabled
                    distance: -60, // Set the distance inside the slice
                    format: '{point.name}: {point.y}', // Customize the label format
                }
            },
        },
        title: {
            text: title
        },
        xAxis: {
            type: "category",
            minPadding: 0,
            maxPadding: 0,
        },
        series: [
            {
                name: "Antall",
                data: Object.entries(data)
                    // compare by key
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([category, value]) => [category, value]),
                colors: colors,
            }
        ],
        subtitle: {
            text: `Totalt ${Object.values(data).reduce((a, b) => a + b, 0)}`
        }
    };

    return <div>
        <HighchartsReact
            highcharts={Highcharts}
            options={highchartsOptions}
        />
    </div>
};

export default PieChart;