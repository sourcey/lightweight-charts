import { PlotRow } from './plot-data';
import { PlotList } from './plot-list';
import { SeriesType } from './series-options';

export interface HistogramPlotRow extends PlotRow {
	readonly color?: string;
}

export interface HeatmapPlotRowItem {
 value: number;
 intensity?: number;
 color?: string;
}

export interface HeatmapPlotRow extends PlotRow {
	readonly values: HeatmapPlotRowItem[];
}

export interface SeriesPlotRowTypeAtTypeMap {
	Bar: PlotRow;
	Candlestick: PlotRow;
	Heatmap: HeatmapPlotRow;
	Area: PlotRow;
	Line: PlotRow;
	Histogram: HistogramPlotRow;
}

export type SeriesPlotRow<T extends SeriesType = SeriesType> = SeriesPlotRowTypeAtTypeMap[T];
export type SeriesPlotList<T extends SeriesType = SeriesType> = PlotList<SeriesPlotRow<T>>;

export function createSeriesPlotList<T extends SeriesType = SeriesType>(): SeriesPlotList<T> {
	return new PlotList<SeriesPlotRow<T>>();
}
