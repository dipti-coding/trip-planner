// Importing the mock first installs NativeModules.BookingParserModule before
// the pipeline (via shared.ts) destructures it.
import {useFixture} from '../__fixtures__/llmMock';
import {parseBooking} from '../index';
import {CORPUS} from '../__fixtures__/corpus';
import * as fs from 'fs';
import * as path from 'path';

describe('booking golden corpus — current pipeline', () => {
  for (const fx of CORPUS) {
    test(fx.name, async () => {
      useFixture(fx);
      const ocr = fs.readFileSync(
        path.join(__dirname, '../__fixtures__/ocr', fx.ocrFile),
        'utf8',
      );
      const plans = await parseBooking(ocr, fx.tripYear);
      // The corpus characterizes the from-parsed-bulk POST payload, which carries no
      // `missing` field; strip it before comparing (asserted separately in missing.test).
      const stripped = plans.map(p => {
        const copy = {...p};
        delete copy.missing;
        return copy;
      });
      expect(stripped).toEqual(fx.expected);
    });
  }
});
