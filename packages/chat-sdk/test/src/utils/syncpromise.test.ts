import { SyncPromise } from '@utils/syncpromise';

describe('SyncPromise', () => {
  test('simple', () => {
    expect.assertions(1);

    return new SyncPromise<number>((resolve) => {
      resolve(42);
    }).then((val) => {
      expect(val).toBe(42);
    });
  });

  test('simple chaining', () => {
    expect.assertions(1);

    return new SyncPromise<number>((resolve) => {
      resolve(42);
    })
      .then(() => SyncPromise.resolve('a'))
      .then(() => SyncPromise.resolve(0.1))
      .then(() => SyncPromise.resolve(false))
      .then((val) => {
        expect(val).toBe(false);
      });
  });

  test('expose to string', () => {
    const syncpromise = new SyncPromise<number>((resolve) => {
      resolve(42);
    });

    expect(syncpromise.toString()).toEqual('[object SyncPromise]');
  });

  test('simple error catch', () => {
    return new SyncPromise<number>(() => {
      throw new Error('custom error');
    }).catch((e) => {
      expect(e.message).toEqual('custom error');
    });
  });

  test('compare to regular promise', async () => {
    expect.assertions(2);

    const ap = new Promise<string>((resolve) => {
      resolve('1');
    });

    const bp = new Promise<string>((resolve) => {
      resolve('2');
    });

    const cp = new Promise<string>((resolve) => {
      resolve('3');
    });

    const fp = async (s: PromiseLike<string>, prepend: string) =>
      new Promise<string>((resolve) => {
        s.then((val) => {
          resolve(prepend + val);
        }).then(null, () => {
          // bla
        });
      });

    const res = await cp
      .then(async (val) => fp(Promise.resolve('x'), val))
      .then(async (val) => fp(bp, val))
      .then(async (val) => fp(ap, val));

    expect(res).toBe('3x21');

    const a = new SyncPromise<string>((resolve) => {
      resolve('1');
    });

    const b = new SyncPromise<string>((resolve) => {
      resolve('2');
    });

    const c = new SyncPromise<string>((resolve) => {
      resolve('3');
    });

    const f = (s: SyncPromise<string>, prepend: string) =>
      new SyncPromise<string>((resolve) => {
        s.then((val) => {
          resolve(prepend + val);
        }).then(null, () => {
          // no-empty
        });
      });

    return (
      c
        // @ts-ignore
        .then((val) => f(SyncPromise.resolve('x'), val))
        .then((val) => f(b, val))
        // @ts-ignore
        .then((val) => f(a, val))
        .then((val) => {
          expect(val).toBe(res);
        })
    );
  });

  test('simple static', () => {
    expect.assertions(1);

    const p = SyncPromise.resolve(10);
    return p.then((val) => {
      expect(val).toBe(10);
    });
  });

  test('using new Promise internally', () => {
    expect.assertions(2);

    return new SyncPromise<number>((done) => {
      new Promise<number>((resolve) => {
        expect(true).toBe(true);
        resolve(41);
      })
        .then(done)
        .then(null, () => {
          //
        });
    }).then((val) => {
      expect(val).toEqual(41);
    });
  });

  test('with setTimeout', () => {
    jest.useFakeTimers();
    expect.assertions(1);

    return new SyncPromise<number>((resolve) => {
      setTimeout(() => {
        resolve(12);
      }, 10);
      jest.runAllTimers();
    }).then((val) => {
      expect(val).toEqual(12);
    });
  });

  test('calling the callback immediatly', () => {
    expect.assertions(1);

    let foo = 1;

    new SyncPromise<number>(() => {
      foo = 2;
    });

    expect(foo).toEqual(2);
  });

  test('calling the callback not immediatly', () => {
    jest.useFakeTimers();
    expect.assertions(4);

    const qp = new SyncPromise<number>((resolve) =>
      setTimeout(() => {
        resolve(2);
      }),
    );
    qp.then((value) => {
      expect(value).toEqual(2);
    }).then(null, () => {
      // no-empty
    });
    expect(qp).not.toHaveProperty('_value');
    qp.then((value) => {
      expect(value).toEqual(2);
    }).then(null, () => {
      // no-empty
    });
    jest.runAllTimers();
    expect(qp).toHaveProperty('_value');
  });

  test('multiple then returning undefined', () => {
    expect.assertions(3);

    return new SyncPromise<number>((resolve) => {
      resolve(2);
    })
      .then((result) => {
        expect(result).toEqual(2);
      })
      .then((result) => {
        expect(result).toBeUndefined();
      })
      .then((result) => {
        expect(result).toBeUndefined();
      });
  });

  test('multiple then returning different values', () => {
    expect.assertions(3);

    return new SyncPromise<number>((resolve) => {
      resolve(2);
    })
      .then((result) => {
        expect(result).toEqual(2);
        return 3;
      })
      .then((result) => {
        expect(result).toEqual(3);
        return 4;
      })
      .then((result) => {
        expect(result).toEqual(4);
      });
  });

  test('multiple then returning different SyncPromise', () => {
    expect.assertions(2);

    return new SyncPromise<number>((resolve) => {
      resolve(2);
    })
      .then((result) => {
        expect(result).toEqual(2);
        return new SyncPromise<string>((resolve2) => {
          resolve2('yo');
        });
      })
      .then((result) => {
        expect(result).toEqual('yo');
      });
  });

  test('reject immediatly and do not call then', () => {
    expect.assertions(1);

    return new SyncPromise<number>((_, reject) => {
      reject('test');
    })
      .then(() => {
        expect(true).toBeFalsy();
      })
      .then(null, (reason) => {
        expect(reason).toBe('test');
      });
  });

  test('reject', () => {
    expect.assertions(1);

    return new SyncPromise<number>((_, reject) => {
      reject('test');
    }).then(null, (reason) => {
      expect(reason).toBe('test');
    });
  });

  test('rejecting after first then', () => {
    expect.assertions(2);

    return new SyncPromise<number>((resolve) => {
      resolve(2);
    })
      .then((value) => {
        expect(value).toEqual(2);
        return SyncPromise.reject('wat');
      })
      .then(null, (reason) => {
        expect(reason).toBe('wat');
      });
  });
});
