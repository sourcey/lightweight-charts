import { BarPrice } from '../../model/bar';
import { PriceLineOptions } from '../../model/price-line-options';
import { LineStyle } from '../../renderers/draw-line';

export const priceLineOptionsDefaults: PriceLineOptions = {
	color: '#FF0000',
	level: 0 as BarPrice,
	lineStyle: LineStyle.Solid,
	lineWidth: 1,
};
