import { BaseTransport } from 'src/interfaces/base-transport';
import { XHRTransport } from '@services/xhr-transport';

let transport: BaseTransport;

describe('FetchTransport', () => {
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

function mockFetch(status: number, data?: { [key: string]: string }) {
  const xhrMockObj = {
    open: jest.fn(),
    send: jest.fn(),
    setRequestHeader: jest.fn(),
    readyState: 4,
    status,
    response: data,
  };

  const xhrMockClass = () => xhrMockObj;

  // @ts-ignore
  global.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass);
  transport = new XHRTransport('1234');

  setTimeout(() => {
    // @ts-ignore
    xhrMockObj['onreadystatechange']();
  }, 0);
}
