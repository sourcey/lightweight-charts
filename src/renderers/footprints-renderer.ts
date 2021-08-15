import { fillRectInnerBorder } from '../helpers/canvas-helpers';
import { formatAmount } from '../helpers/mathex';

import { SeriesItemsIndexesRange } from '../model/time-data';
import { BandCoordinates, BandPrices } from '../model/bar';
// import { Coordinate } from '../model/coordinate';

import { BarCandlestickItemBase } from './bars-renderer';
import { IPaneRenderer } from './ipane-renderer';

import { optimalCandlestickWidth } from './optimal-bar-width';


import { FootprintPlotRowItem } from '../model/series-data';
// export interface FootprintValue extends PricedValue, TimedValue {
// 	color: string;
// }
// , BandCoordinates, BandPrices
export type FootprintItemBase = BarCandlestickItemBase & BandCoordinates & BandPrices;

export interface FootprintItem extends FootprintItemBase {
	candleColor: string;
	// candleColor: string;
	// candleColor: string;

	// upper: BarPrice;
	// lower: BarPrice;
	// upperY: Coordinate;
	// lowerY: Coordinate;

	values: FootprintPlotRowItem[];
}

export interface PaneRendererFootprintsData {
	bars: readonly FootprintItem[];

	barSpacing: number;
	alignEdges: boolean;

	// candleColor: string;
	candleWickVisible: boolean;
	candleBorderVisible: boolean;
	candleBodyVisible: boolean;

	// Footprint
	clusterVisible: boolean;
	clusterColor: string;
	clusterTextColors: Array<string>;
	clusterTextType: string;
	clusterType: string;
	clusterSizeY: number;
	clusterBuyColors: Array<string>;
	clusterSellColors: Array<string>;
	clusterThresholds: Array<number>;

	// Volume Profile
	volumeProfileTextColor: string;
	volumeProfileBuyColor: string;
	volumeProfileSellColor: string;
	volumeProfilePocColor: string;
	volumeProfilePocExtend: boolean;

	visibleRange: SeriesItemsIndexesRange | null;
}

export interface VolumeProfileData {
	vbuy: number;
	vsell: number;
	tbuy: number;
	tsell: number;
	volume: number;
	total: number;
	poc: boolean;
}

export interface VolumeProfile {
	rows: VolumeProfileData[];
	poc: VolumeProfileData | null;
}

const enum Constants {
	BarBorderWidth = 1,
}

export class PaneRendererFootprints implements IPaneRenderer {
	private _data: PaneRendererFootprintsData | null = null;

	// scaled with pixelRatio
	private _barWidth: number = 0;
	private _prevFillColor: string | undefined = '';

	public setData(data: PaneRendererFootprintsData): void {
		this._data = data;
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
			return;
		}

		// now we know pixelRatio and we could calculate barWidth effectively
		this._barWidth = this._data.alignEdges ?
			(this._data.barSpacing * pixelRatio) - 1 :
			optimalCandlestickWidth(this._data.barSpacing, pixelRatio);

		// grid and crosshair have line width = Math.floor(pixelRatio)
		// if this value is odd, we have to make Footprints' width odd
		// if this value is even, we have to make Footprints' width even
		// in order of keeping crosshair-over-Footprints drawing symmetric
		if (this._barWidth >= 2) {
			const wickWidth = Math.floor(pixelRatio);
			if ((wickWidth % 2) !== (this._barWidth % 2)) {
				this._barWidth--;
			}
		}

		this._prevFillColor = ''

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const bar = this._data.bars[i];

			if (this._data.candleBodyVisible) { // || this._barWidth > borderWidth * 2
				this._drawCandles(ctx, bar, pixelRatio);
			}

			if (this._data.candleWickVisible) {
				this._drawWicks(ctx, bar, pixelRatio);
			}

			if (this._data.candleBorderVisible) {
				this._drawBorder(ctx, bar, this._data.barSpacing, pixelRatio);
			}

			if (this._data.clusterVisible && bar.values && bar.values.length) {
				this._drawCluster(ctx, bar, pixelRatio);
			}
		}
	}

	private _drawWicks(ctx: CanvasRenderingContext2D, bar: FootprintItem, pixelRatio: number): void {
		if (this._data === null) {
			return;
		}

		let wickWidth = Math.min(Math.floor(pixelRatio), Math.floor(this._data.barSpacing * pixelRatio));
		wickWidth = Math.max(Math.floor(pixelRatio), Math.min(wickWidth, this._barWidth));
		const wickOffset = Math.floor(wickWidth * 0.5);

		let prevEdge: number | null = null;

		this._setFillColor(ctx, bar.candleColor);

		const top = Math.round(Math.min(bar.openY, bar.closeY) * pixelRatio);
		const bottom = Math.round(Math.max(bar.openY, bar.closeY) * pixelRatio);

		const high = Math.round(bar.highY * pixelRatio);
		const low = Math.round(bar.lowY * pixelRatio);

		const scaledX = Math.round(pixelRatio * bar.x);

		let left = scaledX - wickOffset;
		const right = left + wickWidth - 1;
		if (prevEdge !== null) {
			left = Math.max(prevEdge + 1, left);
			left = Math.min(left, right);
		}
		const width = right - left + 1;

		ctx.fillRect(left, high, width, top - high);
		ctx.fillRect(left, bottom + 1, width, low - bottom);

		prevEdge = right;
	}

	private _setFillColor(ctx: CanvasRenderingContext2D, color: string): void {
		if (color !== this._prevFillColor) {
			ctx.fillStyle = color;
			this._prevFillColor = color;
		}
	}

	private _calculateBorderWidth(pixelRatio: number): number {
		let borderWidth = Math.floor(Constants.BarBorderWidth * pixelRatio);
		if (this._barWidth <= 2 * borderWidth) {
			borderWidth = Math.floor((this._barWidth - 1) * 0.5);
		}
		const res = Math.max(Math.floor(pixelRatio), borderWidth);
		if (this._barWidth <= res * 2) {
			// do not draw bodies, restore original value
			return Math.max(Math.floor(pixelRatio), Math.floor(Constants.BarBorderWidth * pixelRatio));
		}
		return res;
	}

	private _drawBorder(ctx: CanvasRenderingContext2D, bar: FootprintItem, barSpacing: number, pixelRatio: number): void {
		if (this._data === null) {
			return;
		}
		// let prevBorderColor: string | undefined = '';
		const borderWidth = this._calculateBorderWidth(pixelRatio);

		let prevEdge: number | null = null;

		this._setFillColor(ctx, bar.candleColor);

		let left = Math.round(bar.x * pixelRatio) - Math.floor(this._barWidth * 0.5);
		// this is important to calculate right before patching left
		const right = left + this._barWidth - 1;

		const top = Math.round(Math.min(bar.openY, bar.closeY) * pixelRatio);
		const bottom = Math.round(Math.max(bar.openY, bar.closeY) * pixelRatio);

		if (prevEdge !== null) {
			left = Math.max(prevEdge + 1, left);
			left = Math.min(left, right);
		}
		if (this._data.barSpacing * pixelRatio > 2 * borderWidth) {
			fillRectInnerBorder(ctx, left, top, right - left + 1, bottom - top + 1, borderWidth);
		} else {
			const width = right - left + 1;
			ctx.fillRect(left, top, width, bottom - top + 1);
		}
		prevEdge = right;
	}

	private _drawCandles(ctx: CanvasRenderingContext2D, bar: FootprintItem, pixelRatio: number): void {
		if (this._data === null) {
			return;
		}

		const borderWidth = this._calculateBorderWidth(pixelRatio);

		let top = Math.round(Math.min(bar.openY, bar.closeY) * pixelRatio);
		let bottom = Math.round(Math.max(bar.openY, bar.closeY) * pixelRatio);

		let left = Math.round(bar.x * pixelRatio) - Math.floor(this._barWidth * 0.5);
		let right = left + this._barWidth - 1;

		this._setFillColor(ctx, bar.candleColor);

		if (this._data.candleBorderVisible) {
			left += borderWidth;
			top += borderWidth;
			right -= borderWidth;
			bottom -= borderWidth;
		}

		if (top > bottom) {
			return;
		}
		ctx.fillRect(left, top, right - left + 1, bottom - top + 1);
	}

	private _clusterColor(vbuy: number, vsell: number, defaultColor: string): string {
		if (this._data) {
	    for (let i = this._data.clusterThresholds.length - 1; i >= 0; i--) {
	      if (vbuy > vsell && vbuy > this._data.clusterThresholds[i]) {
	        return this._data.clusterBuyColors[i];
	      }
	      if (vsell > vbuy && vsell > this._data.clusterThresholds[i]) {
	        return this._data.clusterSellColors[i];
	      }
	    }
		}
    return defaultColor;
  }

	private _textColor(vbuy: number, vsell: number, defaultColor: string): string {
		if (this._data) {
      switch(this._data.clusterType) {
			case 'cluster':
				for (let i = this._data.clusterThresholds.length - 1; i >= 0; i--) {
					if (vbuy > vsell && vbuy > this._data.clusterThresholds[i]) {
						return this._data.clusterTextColors[i];
					}
					if (vsell > vbuy && vsell > this._data.clusterThresholds[i]) {
						return this._data.clusterTextColors[i];
					}
					return this._data.clusterTextColors[0];
				}
				break;
        case 'volume-profile':
					return this._data.volumeProfileTextColor;
      }
		}
		// return this._data.volumeProfileTextColor;
    return defaultColor;
  }

	private _volumeProfileColor(profile: VolumeProfileData, defaultColor: string): string {
		if (this._data) {
			if (profile.poc) {
				return this._data.volumeProfilePocColor;
			}
			if (profile.vbuy > profile.vsell) {
				return this._data.volumeProfileBuyColor;
			}
			if (profile.vbuy < profile.vsell) {
				return this._data.volumeProfileSellColor;
			}
		}
    return defaultColor;
  }

	private _generateVolumeProfile(bar: FootprintItem, stepSize: number): VolumeProfile {
		const numSteps = (bar.upper - bar.lower) / stepSize;
		const rows = [];
		let poc = null;
		for (let step = 0; step < numSteps; step++) {
			const data = {
				vbuy: 0,
				vsell: 0,
				tbuy: 0,
				tsell: 0,
				volume: 0,
				total: 0,
				poc: false
			}

			const priceStep = step * stepSize;
			const finalStep = step === numSteps - 1;
			const stepHigh = bar.upper - priceStep;
			const stepLow = bar.upper - (priceStep + stepSize);
      bar.values.forEach(value => {
        if (value.price <= stepHigh && (finalStep ? value.price >= stepLow : value.price > stepLow)) {
          data.tbuy += value.vbuy * value.price;
          data.tsell += value.vsell * value.price;
					data.vbuy += value.vbuy;
					data.vsell += value.vsell;
        }
      })
			data.volume = data.vbuy + data.vsell;
			data.total = data.tbuy + data.tsell;
			if (!poc || data.volume > poc.volume) {
				data.poc = true;
				if (poc)
					poc.poc = false;
				poc = data;
			}
			rows.push(data);
		}
		return { rows, poc }
	}

	private _drawCluster(ctx: CanvasRenderingContext2D, bar: FootprintItem, pixelRatio: number): void {
		if (this._data === null) {
			return;
		}

		let top = Math.round(bar.upperY * pixelRatio);
		let bottom = Math.round(bar.lowerY * pixelRatio);

		let left = Math.round(bar.x * pixelRatio) - Math.floor(this._barWidth * 0.5);
		let right = left + this._barWidth - 1;

		if (top > bottom) {
			return;
		}

		const volumeProfile = this._generateVolumeProfile(bar, this._data.clusterSizeY);
		const width = right - left + 1
		const height = bottom - top + 1

		const stepSize = this._data.clusterSizeY;
		const numSteps = (bar.upper - bar.lower) / stepSize
		const boxHeight = height / numSteps

		for (let step = 0; step < numSteps; step++) {
      const topOffset = step * boxHeight;
			const profile = volumeProfile.rows[step];

      if ((step === 0 || step === numSteps - 1) && profile.tbuy === 0 && profile.tsell=== 0) {
				// console.log('[footprint] skip 0 tail')
				continue
			}

      switch(this._data.clusterType) {
        case 'volume-profile':
					const profileWidth = volumeProfile.poc ? (profile.volume / volumeProfile.poc.volume) : 0;

					// console.log('footprint', volumeProfile, profile, profileWidth, this._data.clusterType,  this._volumeProfileColor(profile, this._data.clusterColor), numSteps, boxHeight, width, height, bar.values)
					// this._setFillColor(ctx, this._volumeProfileColor(profile, this._data.clusterColor));
					ctx.fillStyle = this._volumeProfileColor(profile, this._data.clusterColor);
					ctx.fillRect(left, top + topOffset, width * profileWidth, boxHeight - 1);
					break;
        case 'cluster':
        default:
					// this._setFillColor(ctx, this._clusterColor(profile.tbuy, profile.tsell, this._data.clusterColor));
					ctx.fillStyle = this._clusterColor(profile.tbuy, profile.tsell, this._data.clusterColor);
					ctx.fillRect(left, top + topOffset, width, boxHeight - 1);
      }

      if (boxHeight > 20 && width > 60) {
        const fontSize = boxHeight < 25 || width < 60 ? 9 :
                         boxHeight < 30 ? 10 :
                         boxHeight < 40 ? 11 : 12;

        ctx.font = fontSize + "px Helvetica";
        ctx.fillStyle = this._textColor(profile.tbuy, profile.tsell, this._data.volumeProfileTextColor);
				// this._data.clusterTextColors;
				// this._setFillColor(ctx, this._data.clusterTextColors);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        switch(this._data.clusterTextType) {
          case 'volume':
            ctx.fillText(formatAmount(profile.total), left + (width / 2), top + topOffset + (boxHeight/2));
						break;
          case 'delta':
            ctx.fillText(formatAmount(profile.tbuy - profile.tsell), left + (width / 2), top + topOffset + (boxHeight/2));
						break;
          case 'bid-ask':
          default:
            ctx.fillText(formatAmount(profile.tsell) + '   ' + formatAmount(profile.tbuy), left + (width / 2), top + topOffset + (boxHeight/2));
        }
      }
		}
	}
}
