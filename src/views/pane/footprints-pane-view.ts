import { undefinedIfNull } from '../../helpers/strict-type-checks';
import { roundUp, roundDown } from '../../helpers/mathex';

import { BarPrice } from '../../model/bar';
import { Coordinate } from '../../model/coordinate';
// import { PlotRowValueIndex } from '../../model/plot-data';
import { PriceScale } from '../../model/price-scale';
import { TimeScale } from '../../model/time-scale';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { SeriesPlotRow } from '../../model/series-data';
import { TimePointIndex } from '../../model/time-data';
import {
	FootprintItem,
	PaneRendererFootprints,
	PaneRendererFootprintsData
} from '../../renderers/footprints-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { BarsPaneViewBase } from './bars-pane-view-base';

export class SeriesFootprintsPaneView extends BarsPaneViewBase<'Footprint', FootprintItem> {
	private readonly _renderer: PaneRendererFootprints = new PaneRendererFootprints();

	public renderer(height: number, width: number): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		const footprintStyleProps = this._series.options();

		this._makeValid();
		const data: PaneRendererFootprintsData = {
			bars: this._items,
			barSpacing: this._model.timeScale().barSpacing(),
			visibleRange: this._itemsVisibleRange,

			alignEdges: footprintStyleProps.alignEdges,

			// Candlestick
			candleWickVisible: footprintStyleProps.candleWickVisible,
			candleBorderVisible: footprintStyleProps.candleBorderVisible,
			candleBodyVisible: footprintStyleProps.candleBodyVisible,

			// Cluster
			clusterVisible: footprintStyleProps.clusterVisible,
			clusterColor: footprintStyleProps.clusterColor,
			clusterTextColor: footprintStyleProps.clusterTextColor,
			clusterTextType: footprintStyleProps.clusterTextType,
			clusterType: footprintStyleProps.clusterType,
			clusterSizeY: footprintStyleProps.clusterSizeY,
			clusterBuyColors: footprintStyleProps.clusterBuyColors,
			clusterSellColors: footprintStyleProps.clusterSellColors,
			clusterThresholds: footprintStyleProps.clusterThresholds,
		};

		this._renderer.setData(data);

		return this._renderer;
	}

	protected _updateOptions(): void {
		this._items.forEach((item: FootprintItem) => {
			const style = this._series.barColorer().barStyle(item.time);
			item.candleColor = style.barColor;
			// item.wickColor = style.barWickColor;
			// item.borderColor = style.barBorderColor;
		});
	}

	protected _convertToCoordinates(priceScale: PriceScale, timeScale: TimeScale, firstValue: number): void {
		timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
		priceScale.barPricesToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
		// super._convertToCoordinates(priceScale, timeScale, firstValue);
		priceScale.barBandsToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
	}

	protected _fillRawPoints(): void {
		const colorer = this._series.barColorer();
		const footprintStyleProps = this._series.options();

		this._items = this._series.bars().rows().map((row: SeriesPlotRow<'Footprint'>) => {
			const item = this._createRawItem(row.index, row, colorer);
			// barPriceToCoordinates
			item.upper = roundUp(item.high, footprintStyleProps.clusterSizeY) as BarPrice;
			item.lower = roundDown(item.low , footprintStyleProps.clusterSizeY) as BarPrice;
			item.values = row.values;
			return item
		});
	}

	protected _createRawItem(time: TimePointIndex, bar: SeriesPlotRow, colorer: SeriesBarColorer): FootprintItem {
		const style = colorer.barStyle(time);

		return {
			...this._createDefaultItem(time, bar, colorer),
			candleColor: style.barColor,
			// clusterColor: style.barColor,
			// wickColor: style.barWickColor,
			// candleBorderColor: style.barBorderColor,
			upper: NaN as BarPrice,
			lower: NaN as BarPrice,
			upperY: NaN as Coordinate,
			lowerY: NaN as Coordinate,


			// barPriceToCoordinates
			// item.upper = roundUp(item.high, footprintStyleProps.clusterSizeY) as BarPrice;
			// item.lower = roundDown(item.low , footprintStyleProps.clusterSizeY) as BarPrice;
			values: [],
		};
	}
}
