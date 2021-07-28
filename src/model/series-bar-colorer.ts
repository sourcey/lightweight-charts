import { ensure, ensureNotNull } from '../helpers/assertions';

import { PlotRowValueIndex } from './plot-data';
import { Series } from './series';
import { SeriesPlotRow } from './series-data';
import {
	AreaStyleOptions,
	BarStyleOptions,
	CandlestickStyleOptions,
	HistogramStyleOptions,
	LineStyleOptions,
	HeatmapStyleOptions,
	FootprintStyleOptions
} from './series-options';
import { TimePointIndex } from './time-data';

export interface PrecomputedBars {
	value: SeriesPlotRow;
	previousValue?: SeriesPlotRow;
}

export interface BarColorerStyle {
	barColor: string;
	barBorderColor: string; // Used in Candlesticks
	barWickColor: string; // Used in Candlesticks
}

const emptyResult: BarColorerStyle = {
	barColor: '',
	barBorderColor: '',
	barWickColor: '',
};

export class SeriesBarColorer {
	private _series: Series;

	public constructor(series: Series) {
		this._series = series;
	}

	public barStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		// precomputedBars: {value: [Array BarValues], previousValue: [Array BarValues] | undefined}
		// Used to avoid binary search if bars are already known

		const targetType = this._series.seriesType();
		const seriesOptions = this._series.options();
		switch (targetType) {
			case 'Line':
				return this._lineStyle(seriesOptions as LineStyleOptions);

			case 'Area':
				return this._areaStyle(seriesOptions as AreaStyleOptions);

			case 'Bar':
				return this._barStyle(seriesOptions as BarStyleOptions, barIndex, precomputedBars);

			case 'Candlestick':
				return this._candleStyle(seriesOptions as CandlestickStyleOptions, barIndex, precomputedBars);

			case 'Histogram':
				return this._histogramStyle(seriesOptions as HistogramStyleOptions, barIndex, precomputedBars);

			case 'Heatmap':
				return this._heatmapStyle(seriesOptions as HeatmapStyleOptions);

			case 'Footprint':
				return this._footprintStyle(seriesOptions as FootprintStyleOptions, barIndex, precomputedBars);
		}

		throw new Error('Unknown chart style');
	}

	private _barStyle(barStyle: BarStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		const result: BarColorerStyle = { ...emptyResult };

		const upColor = barStyle.upColor;
		const downColor = barStyle.downColor;
		const borderUpColor = upColor;
		const borderDownColor = downColor;

		const currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars));
		const isUp = ensure(currentBar.value[PlotRowValueIndex.Open]) <= ensure(currentBar.value[PlotRowValueIndex.Close]);

		result.barColor = isUp ? upColor : downColor;
		result.barBorderColor = isUp ? borderUpColor : borderDownColor;

		return result;
	}

	private _candleStyle(candlestickStyle: CandlestickStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		const result: BarColorerStyle = { ...emptyResult };

		const upColor = candlestickStyle.upColor;
		const downColor = candlestickStyle.downColor;
		const borderUpColor = candlestickStyle.borderUpColor;
		const borderDownColor = candlestickStyle.borderDownColor;

		const wickUpColor = candlestickStyle.wickUpColor;
		const wickDownColor = candlestickStyle.wickDownColor;

		const currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars));
		const isUp = ensure(currentBar.value[PlotRowValueIndex.Open]) <= ensure(currentBar.value[PlotRowValueIndex.Close]);

		result.barColor = isUp ? upColor : downColor;
		result.barBorderColor = isUp ? borderUpColor : borderDownColor;
		result.barWickColor = isUp ? wickUpColor : wickDownColor;

		return result;
	}

	private _areaStyle(areaStyle: AreaStyleOptions): BarColorerStyle {
		return {
			...emptyResult,
			barColor: areaStyle.lineColor,
		};
	}

	private _lineStyle(lineStyle: LineStyleOptions): BarColorerStyle {
		return {
			...emptyResult,
			barColor: lineStyle.color,
		};
	}

	private _histogramStyle(histogramStyle: HistogramStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		const result: BarColorerStyle = { ...emptyResult };
		const currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Histogram'>;
		result.barColor = currentBar.color !== undefined ? currentBar.color : histogramStyle.color;
		return result;
	}

	private _heatmapStyle(heatmapStyle: HeatmapStyleOptions): BarColorerStyle {
		return {
			...emptyResult,
			barColor: heatmapStyle.color,
		};
	}

	private _footprintStyle(footprintStyle: FootprintStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
		const result: BarColorerStyle = { ...emptyResult };

		// candleUpColor: string;
		// candleDownColor: string;
		// candleWickVisible: boolean;
		// candleBorderVisible: boolean;
		// candleBodyVisible: boolean;
		//
		// clusterColor: string;
		// clusterTextColor: string;
		// clusterTextType: string;
		// clusterType: string;
		// clusterSizeY: number;
		// clusterBuyColors: Array<string>;
		// clusterSellColors: Array<string>;
		// clusterThresholds: Array<number>;

		const upColor = footprintStyle.candleUpColor;
		const downColor = footprintStyle.candleDownColor;
		// const borderUpColor = footprintStyle.borderUpColor;
		// const borderDownColor = footprintStyle.borderDownColor;
		//
		// const wickUpColor = footprintStyle.wickUpColor;
		// const wickDownColor = footprintStyle.wickDownColor;

		const currentBar = ensureNotNull(this._findBar(barIndex, precomputedBars));
		const isUp = ensure(currentBar.value[PlotRowValueIndex.Open]) <= ensure(currentBar.value[PlotRowValueIndex.Close]);

		result.barColor = isUp ? upColor : downColor;
		// result.clusterColor = footprintStyle.clusterColor;
		// isUp ? upColor : downColor;

		// result.barBorderColor = isUp ? borderUpColor : borderDownColor;
		// result.barWickColor = isUp ? wickUpColor : wickDownColor;

		return result;
		// return {
		// 	...emptyResult,
		// 	barColor: footprintStyle.color,
		// };
	}

	private _findBar(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): SeriesPlotRow | null {
		if (precomputedBars !== undefined) {
			return precomputedBars.value;
		}

		return this._series.bars().valueAt(barIndex);
	}
}
