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
	clusterTextColor: string;
	clusterTextType: string;
	clusterType: string;
	clusterSizeY: number;
	clusterBuyColors: Array<string>;
	clusterSellColors: Array<string>;
	clusterThresholds: Array<number>;

	visibleRange: SeriesItemsIndexesRange | null;
}

const enum Constants {
	BarBorderWidth = 1,
}

export class PaneRendererFootprints implements IPaneRenderer {
	private _data: PaneRendererFootprintsData | null = null;

	// scaled with pixelRatio
	private _barWidth: number = 0;

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

		const bars = this._data.bars;

		// const borderWidth = this._calculateBorderWidth(pixelRatio);

		if (this._data.candleBodyVisible) { // || this._barWidth > borderWidth * 2
		// if (this._barWidth > 12000) {
			this._drawCandles(ctx, bars, this._data.visibleRange, pixelRatio);
		}

		if (this._data.clusterVisible) {
			this._drawCluster(ctx, bars, this._data.visibleRange, pixelRatio);
		}

		// console.log('AAAA', this._data.candleWickVisible, this._data.candleBorderVisible, this._data.clusterVisible)
		if (this._data.candleWickVisible) {
			this._drawWicks(ctx, bars, this._data.visibleRange, pixelRatio);
		}

		if (this._data.candleBorderVisible) {
			this._drawBorder(ctx, bars, this._data.visibleRange, this._data.barSpacing, pixelRatio);
		}

	}

	private _drawWicks(ctx: CanvasRenderingContext2D, bars: readonly FootprintItem[], visibleRange: SeriesItemsIndexesRange, pixelRatio: number): void {
		if (this._data === null) {
			return;
		}
		let prevWickColor = '';

		let wickWidth = Math.min(Math.floor(pixelRatio), Math.floor(this._data.barSpacing * pixelRatio));
		wickWidth = Math.max(Math.floor(pixelRatio), Math.min(wickWidth, this._barWidth));
		const wickOffset = Math.floor(wickWidth * 0.5);

		let prevEdge: number | null = null;

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];
			if (bar.candleColor !== prevWickColor) {
				ctx.fillStyle = bar.candleColor;
				prevWickColor = bar.candleColor;
			}

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

	private _drawBorder(ctx: CanvasRenderingContext2D, bars: readonly FootprintItem[], visibleRange: SeriesItemsIndexesRange, barSpacing: number, pixelRatio: number): void {
		if (this._data === null) {
			return;
		}
		let prevBorderColor: string | undefined = '';
		const borderWidth = this._calculateBorderWidth(pixelRatio);

		let prevEdge: number | null = null;

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];
			if (bar.candleColor !== prevBorderColor) {
				ctx.fillStyle = bar.candleColor;
				prevBorderColor = bar.candleColor;
			}

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
	}

	private _drawCandles(ctx: CanvasRenderingContext2D, bars: readonly FootprintItem[], visibleRange: SeriesItemsIndexesRange, pixelRatio: number): void {
		if (this._data === null) {
			return;
		}

		let prevBarColor = '';

		const borderWidth = this._calculateBorderWidth(pixelRatio);

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];

			let top = Math.round(Math.min(bar.openY, bar.closeY) * pixelRatio);
			let bottom = Math.round(Math.max(bar.openY, bar.closeY) * pixelRatio);

			let left = Math.round(bar.x * pixelRatio) - Math.floor(this._barWidth * 0.5);
			let right = left + this._barWidth - 1;

			if (bar.candleColor !== prevBarColor) {
				const barColor = bar.candleColor;
				ctx.fillStyle = barColor;
				prevBarColor = barColor;
			}

			if (this._data.candleBorderVisible) {
				left += borderWidth;
				top += borderWidth;
				right -= borderWidth;
				bottom -= borderWidth;
			}

			if (top > bottom) {
				continue;
			}
			ctx.fillRect(left, top, right - left + 1, bottom - top + 1);
		}
	}

	private _barColor(vbuy: number, vsell: number, defaultColor: string): string {
		if (this._data) {
	    for (let i = this._data.clusterThresholds.length - 1; i >= 0; i--) {
	      if (vbuy > vsell && vbuy > this._data.clusterThresholds[i]) {
	        return this._data.clusterBuyColors[i]
	      }
	      if (vsell > vbuy && vsell > this._data.clusterThresholds[i]) {
	        return this._data.clusterSellColors[i]
	      }
	    }
		}
    return defaultColor
  }

	private _drawCluster(ctx: CanvasRenderingContext2D, bars: readonly FootprintItem[], visibleRange: SeriesItemsIndexesRange, pixelRatio: number): void {
		if (this._data === null) {
			return;
		}

		// let prevBarColor = '';

		// const borderWidth = this._calculateBorderWidth(pixelRatio);

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];

			let top = Math.round(bar.upperY * pixelRatio);
			let bottom = Math.round(bar.lowerY * pixelRatio);
			// let top = Math.round(Math.min(bar.openY, bar.closeY) * pixelRatio);
			// let bottom = Math.round(Math.max(bar.openY, bar.closeY) * pixelRatio);

			let left = Math.round(bar.x * pixelRatio) - Math.floor(this._barWidth * 0.5);
			let right = left + this._barWidth - 1;

			// if (bar.color !== prevBarColor) {
			// 	const barColor = bar.color;
			// 	ctx.fillStyle = barColor;
			// 	prevBarColor = barColor;
			// }
			// if (this._data.candleBorderVisible) {
			// 	left += borderWidth;
			// 	top += borderWidth;
			// 	right -= borderWidth;
			// 	bottom -= borderWidth;
			// }

			if (top > bottom) {
				continue;
			}

			const width = right - left + 1
			const height = bottom - top + 1

			// ctx.fillRect(left, top, width, height);

			const rounding = this._data.clusterSizeY;
      const highValue = bar.upper //roundUp(bar.upper, rounding)
      const lowValue = bar.lower //roundDown(bar.lower, rounding)
			const numSteps = (highValue - lowValue) / rounding
			const boxHeight = height / numSteps

			// console.log('footprint', numSteps, boxHeight, width, height, bar.values)
			for (let step = 0; step < numSteps; step++) {
        const topOffset = step * boxHeight
        // const x = -(datum.width / 2),
        //   y = yOffset,
        //   w = datum.width,
        //   h = boxHeight

        const priceStep = ((step) * rounding)
        const lastStep = step === numSteps - 1
				//
        let vbuy = 0, vsell = 0
        // if (datum.d.footprint) {
        bar.values.forEach(value => {
          if (value.price <= highValue - priceStep &&
              (lastStep ?
                value.price >= (highValue - (priceStep + rounding)) :
                value.price > (highValue - (priceStep + rounding)))) {
            vbuy += value.vbuy * value.price
            vsell += value.vsell * value.price
          }
          // else {
          //   console.log('priceprice', price, step, mainValue - priceStep, (mainValue - (priceStep + rounding)),
          //     price < mainValue + priceStep, price > (mainValue + priceStep + rounding), step, priceStep, datum.d.footprint)
          // }
        })


				// console.log('footprint', vbuy, vsell, bar.values)
        // }color
				//
        ctx.fillStyle = this._barColor(vbuy, vsell, this._data.clusterColor); //bar.color //'#c00' //barColor(vbuy, vsell)
        ctx.fillRect(left, top + topOffset, width, boxHeight - 1);
        // ctx.rect(left, top + topOffset, width, boxHeight);

        if (boxHeight > 20 && width > 60) {
          const fontSize = boxHeight < 25 || width < 60 ? 9 :
                           boxHeight < 30 ? 10 :
                           boxHeight < 40 ? 11 : 12;

          ctx.font = fontSize + "px Helvetica";
          ctx.fillStyle = this._data.clusterTextColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          switch(this._data.clusterTextType) {
            case 'volume':
              ctx.fillText(formatAmount(vbuy + vsell), left + (width / 2), top + topOffset + (boxHeight/2));
							break;
            case 'delta':
              ctx.fillText(formatAmount(vbuy - vsell), left + (width / 2), top + topOffset + (boxHeight/2));
							break;
            case 'bid-ask':
            default:
              ctx.fillText(formatAmount(vsell) + '   ' + formatAmount(vbuy), left + (width / 2), top + topOffset + (boxHeight/2));
          }

          // context.fillText(formatAmount(vbuy) + ': ' + formatAmount(vsell),x+6,y+(boxHeight/2)+3);
          // return formatAmount(vbuy) + ': ' + formatAmount(vsell),x+6,y+(boxHeight/2)+3+3

          // context.fillText(formatAmount(vbuy) + ': ' + formatAmount(vsell) + ': ' + formatAmount(vbuy - vsell),x+6,y+(boxHeight/2)+3);
        }

        // ctx.stroke();
        // ctx.fill();
			}

      // // TODO: Get from base. bar.mainValue(datum.d, i) not working?
      // const mainValue = roundUp(datum.d.high, rounding)
      // const baseValue = roundDown(datum.d.low, rounding)
      // const steps = (mainValue - baseValue) / rounding
      // const height = datum.y0 - datum.y
      // const boxHeight = height / steps
			//
      // if (!steps || !height)
      //   console.log('last datum', steps, height, mainValue, baseValue, datum.d.high, datum.d.low, datum)
			//
      // for (let step = 0; step < steps; step++) {
      //   const yOffset = step * boxHeight
      //   const x = -(datum.width / 2),
      //     y = yOffset,
      //     w = datum.width,
      //     h = boxHeight
			//
      //   const priceStep = ((step) * rounding)
      //   const lastStep = step === steps - 1
			//
      //   let vbuy = 0, vsell = 0
      //   if (datum.d.footprint) {
      //     const tradeData = Object.keys(datum.d.footprint).forEach(price => {
      //       if (price <= mainValue - priceStep &&
      //           (lastStep ?
      //             price >= (mainValue - (priceStep + rounding)) :
      //             price > (mainValue - (priceStep + rounding)))) {
      //         vbuy += datum.d.footprint[price].vbuy * price
      //         vsell += datum.d.footprint[price].vsell * price
      //       }
      //       // else {
      //       //   console.log('priceprice', price, step, mainValue - priceStep, (mainValue - (priceStep + rounding)),
      //       //     price < mainValue + priceStep, price > (mainValue + priceStep + rounding), step, priceStep, datum.d.footprint)
      //       // }
      //     })
      //   }
			//
      //   context.fillStyle = barColor(vbuy, vsell)
      //   context.fillRect(x, y, w, h);
      //   context.rect(x, y, w, h);
			//
      //   if (boxHeight > 20 && w > 60) {
      //     const fontSize = boxHeight < 25 || w < 60 ? 9 :
      //                      boxHeight < 30 ? 10 :
      //                      boxHeight < 40 ? 11 : 12;
			//
      //     context.font = fontSize + "px Helvetica";
      //     context.fillStyle = 'white';
      //     context.textAlign = 'center';
      //     context.textBaseline = 'middle';
			//
      //     switch(clusterTextType) {
      //       case 'volume':
      //         context.fillText(formatAmount(vbuy + vsell), 0, y+(boxHeight/2));
      //       case 'delta':
      //         context.fillText(formatAmount(vbuy - vsell), 0, y+(boxHeight/2));
      //       case 'bid-ask':
      //       default:
      //         context.fillText(formatAmount(vsell) + '   ' + formatAmount(vbuy), 0, y+(boxHeight/2));
      //     }
			//
      //     // context.fillText(formatAmount(vbuy) + ': ' + formatAmount(vsell),x+6,y+(boxHeight/2)+3);
      //     // return formatAmount(vbuy) + ': ' + formatAmount(vsell),x+6,y+(boxHeight/2)+3+3
			//
      //     // context.fillText(formatAmount(vbuy) + ': ' + formatAmount(vsell) + ': ' + formatAmount(vbuy - vsell),x+6,y+(boxHeight/2)+3);
      //   }
      // }
		}
	}
}
