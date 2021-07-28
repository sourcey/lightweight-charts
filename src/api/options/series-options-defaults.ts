import {
	AreaStyleOptions,
	BarStyleOptions,
	CandlestickStyleOptions,
	HistogramStyleOptions,
	LineStyleOptions,
	HeatmapStyleOptions,
	FootprintStyleOptions,
	PriceLineSource,
	SeriesOptionsCommon,
} from '../../model/series-options';
import { LineStyle, LineType } from '../../renderers/draw-line';

export const candlestickStyleDefaults: CandlestickStyleOptions = {
	upColor: '#26a69a',
	downColor: '#ef5350',
	wickVisible: true,
	borderVisible: true,
	borderColor: '#378658',
	borderUpColor: '#26a69a',
	borderDownColor: '#ef5350',
	wickColor: '#737375',
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
};

export const barStyleDefaults: BarStyleOptions = {
	upColor: '#26a69a',
	downColor: '#ef5350',
	openVisible: true,
	thinBars: true,
};

export const lineStyleDefaults: LineStyleOptions = {
	color: '#2196f3',
	lineStyle: LineStyle.Solid,
	lineWidth: 3,
	lineType: LineType.Simple,
	crosshairMarkerVisible: true,
	crosshairMarkerRadius: 4,
	crosshairMarkerBorderColor: '',
	crosshairMarkerBackgroundColor: '',
};

export const areaStyleDefaults: AreaStyleOptions = {
	topColor: 'rgba( 46, 220, 135, 0.4)',
	bottomColor: 'rgba( 40, 221, 100, 0)',
	lineColor: '#33D778',
	lineStyle: LineStyle.Solid,
	lineWidth: 3,
	lineType: LineType.Simple,
	crosshairMarkerVisible: true,
	crosshairMarkerRadius: 4,
	crosshairMarkerBorderColor: '',
	crosshairMarkerBackgroundColor: '',
};

export const histogramStyleDefaults: HistogramStyleOptions = {
	color: '#26a69a',
	base: 0,
};

export const heatmapStyleDefaults: HeatmapStyleOptions = {
	color: '#26a69a',
	colors: [
		'#4575B4',
		'#CD473E',
		'#ABD9E9',
		'#F4AA73',
		'#FFFFBF',
	],
	thresholds: [
		3000000,      // $3,000,000
		5000000,      // $5,000,000
		8000000,      // $8,000,000
		10000000,     // $10,000,000
		15000000,     // $15,000,000
	],
	blockSizeY: 10,
	alpha: 1
};

export const footprintStyleDefaults: FootprintStyleOptions = {
	alignEdges: true,

	// Candlestick defaults
	candleUpColor: '#C5FF48',
	candleDownColor: '#FF3B64',
	candleWickVisible: true,
	candleBorderVisible: true,
	candleBodyVisible: false,

	// Cluster defaults
	clusterVisible: true,
	clusterColor: 'rgba(15, 10, 30, 0.8)',
	clusterTextColor: '#ffffff',
	clusterTextType: 'bid-ask',
	clusterType: 'cluster',
	clusterSizeY: 5,
	clusterBuyColors: [
		'#CFEAFA',
		'#9FD0F1 ',
		'#69ACDE',
		'#3A82C4',
		'#D73027',
	],
	clusterSellColors: [
		'#FFFFBF',
		'#F4AA73',
		'#ABD9E9',
		'#CD473E',
		'#4575B4',
	],
	clusterThresholds: [
		3000000,      // $3,000,000
		5000000,      // $5,000,000
		8000000,      // $8,000,000
		10000000,     // $10,000,000
		15000000,     // $15,000,000
	]
};

export const seriesOptionsDefaults: SeriesOptionsCommon = {
	title: '',
	visible: true,
	lastValueVisible: true,
	priceLineVisible: true,
	priceLineSource: PriceLineSource.LastBar,
	priceLineWidth: 1,
	priceLineColor: '',
	priceLineStyle: LineStyle.Dashed,
	baseLineVisible: true,
	baseLineWidth: 1,
	baseLineColor: '#B2B5BE',
	baseLineStyle: LineStyle.Solid,
	priceFormat: {
		type: 'price',
		precision: 2,
		minMove: 0.01,
	},
};
