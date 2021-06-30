import { supportsFetch } from '@utils/supports';
import * as misc from '@utils/misc';

const headers = global.Headers;
const request = global.Request;
const response = global.Response;

describe('supportsFetch()', () => {
  beforeEach(() => {
    // @ts-ignore
    global.Headers = () => {
      return { append: jest.fn() };
    };

    // @ts-ignore
    global.Request = () => {
      return { append: jest.fn() };
    };
  });

  afterEach(() => {
    global.Headers = headers;
    global.Request = request;
    global.Response = response;
  });

  it('should check if there is fetch support with no fetch', () => {
    expect(supportsFetch()).toBeFalsy;
  });

  it('should check if there is fetch support with fetch and response', () => {
    const data = { foo: 'bar' };

    // @ts-ignore
    global.Response = () => {
      return { append: jest.fn() };
    };

    const response = { status: 200, json: () => Promise.resolve(data) };

    const window = jest.spyOn(misc, 'getGlobalObject');

    window.mockReturnValue({ fetch: () => Promise.resolve(response) });

    expect(supportsFetch()).toBeTruthy();
  });

  it('should check if there is fetch support without response', () => {
    const data = { foo: 'bar' };

    const response = { status: 200, json: () => Promise.resolve(data) };

    const window = jest.spyOn(misc, 'getGlobalObject');

    window.mockReturnValue({ fetch: () => Promise.resolve(response) });

    expect(supportsFetch()).toBeFalsy();
  });
});
