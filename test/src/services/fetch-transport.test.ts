import { BaseTransport } from '../../../src/types/base-transport';
import { FetchTransport } from '../../../src/services/fetch-transport';
import * as misc from '../../../src/utils/misc';

let window: jest.SpyInstance;
let transport: BaseTransport;

describe('FetchTransport', () => {
  beforeEach(() => {
    // @ts-ignore
    global.Headers = () => {
      return { append: jest.fn() };
    };
  });

  describe('post()', () => {
    it('return expect data', async () => {
      const data = { foo: 'bar' };

      mockFetch(200, data);

      const res = await transport.post('test/', {});

      expect(res).toEqual(data);
    });

    it('throw an error', async () => {
      const data = { foo: 'bar' };

      mockFetch(500, data);

      try {
        await transport.post('test/', {});
      } catch (e) {
        expect(e).toBe('failed');
      }
    });
  });

  describe('get()', () => {
    it('return expect data', async () => {
      const data = { foo: 'bar' };

      mockFetch(200, data);

      const res = await transport.get('test/');

      expect(res).toEqual(data);
    });

    it('throw an error', async () => {
      const data = { foo: 'bar' };

      mockFetch(500, data);

      try {
        await transport.get('test/');
      } catch (e) {
        expect(e).toBe('failed');
      }
    });
  });

  describe('delete()', () => {
    it('resolves service called', async () => {
      mockFetch(200);

      const res = await transport.delete('test/');
      expect(res).toEqual(undefined);
    });

    it('throw an error', async () => {
      mockFetch(500);

      try {
        await transport.delete('test/');
      } catch (e) {
        expect(e).toEqual('failed');
      }
    });
  });
});

function mockFetch(status: number, data?: {}) {
  const response = { status, json: () => Promise.resolve(data) };

  window = jest.spyOn(misc, 'getGlobalObject');

  window.mockReturnValue({ fetch: () => Promise.resolve(response) });

  transport = new FetchTransport('1234');
}
