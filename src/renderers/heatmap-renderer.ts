// import { PricedValue } from '../model/price-scale';

import { HeatmapPricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue, TimePointIndex } from '../model/time-data';

import { IPaneRenderer } from './ipane-renderer';

export type HeatmapItem = TimedValue & HeatmapPricedValue;

export interface PaneRendererHeatmapData {
	items: HeatmapItem[];

	priceVisibleRange: Array<number>;
	barSpacing: number;
	colors: Array<string>;
	thresholds: Array<number>;
	blockSizeY: number;
	alpha: number;

	visibleRange: SeriesItemsIndexesRange | null;
}

interface PrecalculatedItemCoordinates {
	left: number;
	right: number;
	roundedCenter: number;
	center: number;
	time: TimePointIndex;
}

export class PaneRendererHeatmap implements IPaneRenderer {
	private _data: PaneRendererHeatmapData | null = null;
	private _precalculatedCache: PrecalculatedItemCoordinates[] = [];

	public setData(data: PaneRendererHeatmapData): void {
		this._data = data;
		this._precalculatedCache = [];
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
			return;
		}
		if (!this._precalculatedCache.length) {
			this._fillPrecalculatedCache(pixelRatio);
		}

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			const current = this._precalculatedCache[i - this._data.visibleRange.from];

			for (const value of item.values) {
				if (this._data.priceVisibleRange.length &&
					(value.price < this._data.priceVisibleRange[0] ||
						value.price > this._data.priceVisibleRange[1])) {
					continue;
				}

				const highY = Math.round(value.y * pixelRatio);
				const lowY = highY;
				const top = highY + (this._data.blockSizeY / 2);
				let bottom = lowY - (this._data.blockSizeY / 2);

				if (highY > 0 && lowY > 0) {
					if (this._data.alpha) {
						ctx.globalAlpha = this._data.alpha
					}
					ctx.fillStyle = this._barColor(value.value)
					ctx.fillRect(current.left, top, current.right - current.left, bottom - top);
				}
			}
		}
	}

	private _barColor(value: number): string {
		if (this._data) {
	    for (let i = this._data.thresholds.length - 1; i >= 0; i--) {
	      if (value > this._data.thresholds[i]) {
	        return this._data.colors[i]
	      }
	    }
		}
    return ''; // transparent
  }

	// eslint-disable-next-line complexity
	private _fillPrecalculatedCache(pixelRatio: number): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
			this._precalculatedCache = [];
			return;
		}
		// const spacing = 0; //Math.ceil(this._data.barSpacing * pixelRatio) <= showSpacingMinimalBarWidth ? 0 : Math.max(1, Math.floor(pixelRatio));
		const columnWidth = Math.round(this._data.barSpacing * pixelRatio);// - spacing;

		this._precalculatedCache = new Array(this._data.visibleRange.to - this._data.visibleRange.from);

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			// force cast to avoid ensureDefined call
			const x = Math.round(item.x * pixelRatio);
			let left: number;
			let right: number;

			const halfWidth = columnWidth / 2;
			left = x - halfWidth;
			right = x + halfWidth;

			this._precalculatedCache[i - this._data.visibleRange.from] = {
				left,
				right,
				roundedCenter: x,
				center: (item.x * pixelRatio),
				time: item.time,
			};
		}
	}
}
