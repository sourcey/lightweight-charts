import { PlotRow } from './plot-data';
import { PlotList } from './plot-list';
import { SeriesType } from './series-options';

export interface HistogramPlotRow extends PlotRow {
	readonly color?: string;
}

export interface HeatmapPlotRowItem {
  price: number;
  value: number;
}

export interface HeatmapPlotRow extends PlotRow {
	readonly values: HeatmapPlotRowItem[];
}

export interface FootprintPlotRowItem {
  price: number;
  vbuy: number;
  vsell: number;
}

export interface FootprintPlotRow extends PlotRow {
	readonly values: FootprintPlotRowItem[];
}

export interface SeriesPlotRowTypeAtTypeMap {
	Bar: PlotRow;
	Candlestick: PlotRow;
	Area: PlotRow;
	Line: PlotRow;
	Histogram: HistogramPlotRow;
	Heatmap: HeatmapPlotRow;
	Footprint: FootprintPlotRow;
}

export type SeriesPlotRow<T extends SeriesType = SeriesType> = SeriesPlotRowTypeAtTypeMap[T];
export type SeriesPlotList<T extends SeriesType = SeriesType> = PlotList<SeriesPlotRow<T>>;

export function createSeriesPlotList<T extends SeriesType = SeriesType>(): SeriesPlotList<T> {
	return new PlotList<SeriesPlotRow<T>>();
}
