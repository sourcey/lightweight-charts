import { ensureNotNull } from '../../helpers/assertions';

import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
// import { PlotRowValueIndex } from '../../model/plot-data';
import { PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { SeriesPlotRow } from '../../model/series-data';
// import { HeatmapPlotRowItem } from '../model/series-data';
import { TimedValue, TimePointIndex, visibleTimedValues } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { HeatmapItem, PaneRendererHeatmap, PaneRendererHeatmapData } from '../../renderers/heatmap-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { SeriesPaneViewBase } from './series-pane-view-base';

function createEmptyHeatmapData(barSpacing: number): PaneRendererHeatmapData {
	return {
		barSpacing,
		priceVisibleRange: [],
		blockSizeY: NaN,
		colors: [],
		thresholds: [],
		items: [],
		alpha: 1,
		visibleRange: null,
	};
}

function createRawItem(time: TimePointIndex, bar: SeriesPlotRow): HeatmapItem {
	return {
		time: time,
		x: NaN as Coordinate,
		values: []
	};
}

export class SeriesHeatmapPaneView extends SeriesPaneViewBase<'Heatmap', TimedValue> {
	private _compositeRenderer: CompositeRenderer = new CompositeRenderer();
	private _heatmapData: PaneRendererHeatmapData = createEmptyHeatmapData(0);
	private _renderer: PaneRendererHeatmap;

	public constructor(series: Series<'Heatmap'>, model: ChartModel) {
		super(series, model, false);
		this._renderer = new PaneRendererHeatmap();
	}

	public renderer(height: number, width: number): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		this._makeValid();
		return this._compositeRenderer;
	}

	protected _fillRawPoints(): void {
		const barSpacing = this._model.timeScale().barSpacing();
		const priceRange = this._series.priceScale().priceRange();
		const heatmapStyleProps = this._series.options();

		this._heatmapData = createEmptyHeatmapData(barSpacing);
		this._heatmapData.blockSizeY = heatmapStyleProps.blockSizeY;
		this._heatmapData.colors = heatmapStyleProps.colors;
		this._heatmapData.thresholds = heatmapStyleProps.thresholds;
		this._heatmapData.alpha = heatmapStyleProps.alpha;

		if (priceRange) {
			this._heatmapData.priceVisibleRange = [priceRange.minValue(), priceRange.maxValue()];
		}

		let targetIndex = 0;
		let itemIndex = 0;

		for (const row of this._series.bars().rows()) {
			const item = createRawItem(row.index, row);
			if (row.values && row.values.length) {
				item.values = row.values.map(x => {
					return {
						price: x.price as BarPrice,
						value: x.value,
						y: NaN as Coordinate
					}
				});				
			}

			targetIndex++;
			if (targetIndex < this._heatmapData.items.length) {
				this._heatmapData.items[targetIndex] = item;
			} else {
				this._heatmapData.items.push(item);
			}
			this._items[itemIndex++] = { time: row.index, x: 0 as Coordinate };
		}

		this._renderer.setData(this._heatmapData);
		this._compositeRenderer.setRenderers([this._renderer]);
	}

	protected _updateOptions(): void {}

	protected _clearVisibleRange(): void {
		super._clearVisibleRange();

		this._heatmapData.visibleRange = null;
	}

	protected _convertToCoordinates(priceScale: PriceScale, timeScale: TimeScale, firstValue: number): void {
		if (this._itemsVisibleRange === null) {
			return;
		}

		const barSpacing = timeScale.barSpacing();
		const visibleBars = ensureNotNull(timeScale.visibleStrictRange());

		timeScale.indexesToCoordinates(this._heatmapData.items);

		// Condense and scale values
		for (const item of this._heatmapData.items) {
			// console.log(item.values)
			//
			// const condensedValues = {}
			// item.values.forEach(val => {
			// 	val.y = roundNearest(val.y, this._heatmapData.blockSizeY)
			// 	if (!condensedValues[val.y]) {
			// 		condensedValues[val.y] = val.size
			// 	}
			// 	else {
			// 		condensedValues[val.y] += val.size
			// 	}
			// })
			//
			// // values: HeatmapPlotRowItem[];

			priceScale.pointsArrayToCoordinates(item.values, firstValue);
		}
		this._heatmapData.visibleRange = visibleTimedValues(this._heatmapData.items, visibleBars, false);
		this._heatmapData.barSpacing = barSpacing;
		// need this to update cache
		this._renderer.setData(this._heatmapData);
	}
}
