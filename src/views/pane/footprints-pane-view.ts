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

		const styleProps = this._series.options();

		this._makeValid();
		const data: PaneRendererFootprintsData = {
			bars: this._items,
			barSpacing: this._model.timeScale().barSpacing(),
			visibleRange: this._itemsVisibleRange,

			alignEdges: styleProps.alignEdges,

			// Candlestick
			candleWickVisible: styleProps.candleWickVisible,
			candleBorderVisible: styleProps.candleBorderVisible,
			candleBodyVisible: styleProps.candleBodyVisible,

			// Cluster
			clusterVisible: styleProps.clusterVisible,
			clusterColor: styleProps.clusterColor,
			clusterTextColors: styleProps.clusterTextColors,
			clusterTextType: styleProps.clusterTextType,
			clusterType: styleProps.clusterType,
			clusterSizeY: styleProps.clusterSizeY,
			clusterBuyColors: styleProps.clusterBuyColors,
			clusterSellColors: styleProps.clusterSellColors,
			clusterThresholds: styleProps.clusterThresholds,

			// Volume Profile
			volumeProfileTextColor: styleProps.volumeProfileTextColor,
			volumeProfileBuyColor: styleProps.volumeProfileBuyColor,
			volumeProfileSellColor: styleProps.volumeProfileSellColor,
			volumeProfilePocColor: styleProps.volumeProfilePocColor,
			volumeProfilePocExtend: styleProps.volumeProfilePocExtend
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
		priceScale.barBandsToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
	}

	protected _fillRawPoints(): void {
		const colorer = this._series.barColorer();
		const styleProps = this._series.options();

		// console.log('_fillRawPoints', this._series.bars().rows().length)
		this._items = this._series.bars().rows().map((row: SeriesPlotRow<'Footprint'>) => {
			const item = this._createRawItem(row.index, row, colorer);
			// barPriceToCoordinates
			item.upper = roundUp(item.high, styleProps.clusterSizeY) as BarPrice;
			item.lower = roundDown(item.low , styleProps.clusterSizeY) as BarPrice;
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
			// item.upper = roundUp(item.high, styleProps.clusterSizeY) as BarPrice;
			// item.lower = roundDown(item.low , styleProps.clusterSizeY) as BarPrice;
			values: [],
		};
	}
}
