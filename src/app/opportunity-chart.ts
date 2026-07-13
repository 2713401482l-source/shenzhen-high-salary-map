import * as echarts from 'echarts/core';
import {ScatterChart} from 'echarts/charts';
import {GridComponent, TooltipComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';

echarts.use([ScatterChart, GridComponent, TooltipComponent, CanvasRenderer]);

export type OpportunityPoint = {
  name: string;
  demand: number;
  salaryMax: number;
  count: number;
  threshold: string;
};

const thresholdColor: Record<string, string> = {
  '中': '#ff8b52',
  '中高': '#f56a22',
  '高': '#c84912',
  '极高': '#72270c',
};

const thresholdSymbol: Record<string, 'circle' | 'diamond' | 'rect' | 'triangle'> = {
  '中': 'circle',
  '中高': 'diamond',
  '高': 'rect',
  '极高': 'triangle',
};

export function createOpportunityChart(element: HTMLDivElement, points: OpportunityPoint[], isDemo: boolean) {
  const chart = echarts.init(element, undefined, {renderer: 'canvas'});
  const highlighted = new Set([...points]
    .sort((a, b) => (b.demand + b.salaryMax / 2) - (a.demand + a.salaryMax / 2))
    .slice(0, 5)
    .map(point => point.name));
  chart.setOption({
    animationDuration: 650,
    animationEasing: 'cubicOut',
    grid: {left: 62, right: 28, top: 34, bottom: 56},
    tooltip: {
      trigger: 'item',
      backgroundColor: '#15181d',
      borderWidth: 0,
      padding: [12, 14],
      textStyle: {color: '#f7f7f5', fontSize: 12},
      formatter: ({data}: {data: {value: number[]; name: string; threshold: string}}) => {
        const label = isDemo ? '结构假设' : '当前样本';
        return `<strong>${data.name}</strong><br/>${label}：${data.value[2]} 个岗位<br/>薪资上限：${data.value[1]}K<br/>能力门槛：${data.threshold}`;
      },
    },
    xAxis: {
      name: '市场需求 →',
      nameLocation: 'middle',
      nameGap: 30,
      min: 0,
      max: 100,
      axisLine: {lineStyle: {color: '#b8babd'}},
      axisTick: {show: false},
      axisLabel: {show: false},
      splitLine: {show: false},
      nameTextStyle: {color: '#5d6168', fontSize: 12},
    },
    yAxis: {
      name: '薪资上限 K/月',
      nameTextStyle: {color: '#5d6168', fontSize: 12},
      axisLine: {show: false},
      axisTick: {show: false},
      axisLabel: {color: '#777b82', fontSize: 11},
      splitLine: {lineStyle: {color: '#e5e5e2', type: 'dashed'}},
    },
    series: [{
      type: 'scatter',
      data: points.map(point => ({
        name: point.name,
        threshold: point.threshold,
        value: [point.demand, point.salaryMax, point.count],
        symbol: thresholdSymbol[point.threshold] ?? 'circle',
        itemStyle: {color: thresholdColor[point.threshold] ?? '#f56a22', opacity: 0.84},
        label: highlighted.has(point.name) ? {show: true, formatter: point.name, position: 'top', distance: 8, color: '#34383f', fontSize: 11} : {show: false},
      })),
      symbolSize: (value: number[]) => Math.max(18, Math.min(56, 12 + Math.sqrt(value[2]) * 6)),
      emphasis: {scale: 1.1, itemStyle: {opacity: 1}},
    }],
  });
  return chart;
}
