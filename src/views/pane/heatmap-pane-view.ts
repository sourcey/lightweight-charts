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
		items: [],
		barSpacing,
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

		this._heatmapData = createEmptyHeatmapData(barSpacing);

		let targetIndex = 0;
		let itemIndex = 0;

		for (const row of this._series.bars().rows()) {
			const item = createRawItem(row.index, row);
			item.values = row.values.map(x => {
				return {
					price: x.value as BarPrice,
					color: x.color, // as string,
					y: NaN as Coordinate
				}
			})

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
		for (const item of this._heatmapData.items) {
			priceScale.pointsArrayToCoordinates(item.values, firstValue);
		}
		this._heatmapData.visibleRange = visibleTimedValues(this._heatmapData.items, visibleBars, false);
		this._heatmapData.barSpacing = barSpacing;
		// need this to update cache
		this._renderer.setData(this._heatmapData);
	}
}
