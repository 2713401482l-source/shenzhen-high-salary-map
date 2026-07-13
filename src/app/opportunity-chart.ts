import {init, use, type EChartsType} from 'echarts/core';
import {ScatterChart} from 'echarts/charts';
import {GridComponent, TooltipComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';

use([ScatterChart, GridComponent, TooltipComponent, CanvasRenderer]);

export type OpportunityPoint = [number, number, number, string];

export function createOpportunityChart(element: HTMLDivElement, points: OpportunityPoint[]): EChartsType {
  const chart = init(element, undefined, {renderer: 'canvas'});
  chart.setOption({
    grid: {left: 44, right: 20, top: 28, bottom: 42},
    tooltip: {trigger: 'item', formatter: (p: {data: OpportunityPoint}) => `${p.data[3]}<br/>加权需求 ${p.data[0]}<br/>薪资中位 ${p.data[1]}K<br/>${p.data[2]} 条岗位`},
    xAxis: {name: '当前样本需求 →', nameLocation: 'middle', nameGap: 28, min: 0, axisLine: {lineStyle: {color: '#aeb3ba'}}, splitLine: {lineStyle: {color: '#eceef0'}}, axisLabel: {color: '#68717d'}},
    yAxis: {name: '薪资中位 K', nameTextStyle: {color: '#68717d'}, axisLine: {show: false}, splitLine: {lineStyle: {color: '#eceef0'}}, axisLabel: {color: '#68717d'}},
    series: [{type: 'scatter', data: points, symbolSize: (value: number[]) => Math.max(16, Math.min(54, 13 + value[2] * 1.45)), itemStyle: {color: '#ff6508', opacity: .82, borderColor: '#fff', borderWidth: 2}, emphasis: {scale: 1.08}}],
  });
  return chart;
}
