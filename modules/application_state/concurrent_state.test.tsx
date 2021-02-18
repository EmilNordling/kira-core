import { FC, Suspense, Component } from 'react';
import { ConcurrentState } from './concurrent_state';
import { render } from '@testing-library/react';

jest.useFakeTimers();

type TypicalState = {
  userName: string;
  age: number;
};

function getTypicalState(): TypicalState {
  return {
    userName: 'max',
    age: 25,
  };
}

const fakeApi = {
  get: () =>
    new Promise<{ userName: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          userName: 'Jocke',
        });
      }),
        10;
    }),
  getError: () =>
    new Promise<{ userName: string }>((_, reject) => {
      setTimeout(() => {
        reject({
          error: 'error',
        });
      }),
        10;
    }),
};

class ErrorBoundary extends Component<
  unknown,
  {
    error: null | Error;
    hasError: boolean;
  }
> {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): { error: Error; hasError: boolean } {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error): void {
    this.setState({
      error,
    });
  }

  render(): React.ReactNode {
    const { error, hasError } = this.state;

    if (hasError) {
      return <div>error: {error.message}</div>;
    }

    return this.props.children;
  }
}

const ConcurrentChild: FC<{ state: ConcurrentState<TypicalState> }> = ({ state }) => {
  const data = state.read();

  return <p>{data.userName}</p>;
};

const ConcurrentParent: FC<{ state: ConcurrentState<TypicalState> }> = ({ state }) => {
  return (
    <Suspense fallback="loading">
      <ConcurrentChild state={state} />
    </Suspense>
  );
};

test('asserts that concurrentState throws a promise when flow is equal to Unset', () => {
  const concurrentState = new ConcurrentState();

  expect(() => concurrentState.read()).toThrowError(Promise);
});

test('asserts that concurrentState throws a promise when flow is equal to Unset with initial state', () => {
  const concurrentState = new ConcurrentState(getTypicalState());

  expect(() => concurrentState.read()).toThrowError(Promise);
});

test('asserts that concurrentState throws a promise when flow is equal to Pending', () => {
  const concurrentState = new ConcurrentState();

  concurrentState.suspend(fakeApi.get(), (response) => {
    return {
      ...response,
      age: 20,
    };
  });

  expect(() => concurrentState.read()).toThrowError(Promise);
});

test('asserts that concurrentState throws a promise when flow is equal to Pending with initial state', () => {
  const concurrentState = new ConcurrentState(getTypicalState());

  concurrentState.suspend(fakeApi.get(), (response) => {
    return {
      ...response,
      age: 20,
    };
  });

  expect(() => concurrentState.read()).toThrowError(Promise);
});

test('asserts that a concurrentState changes state to accessible', (done) => {
  const concurrentState = new ConcurrentState<TypicalState>();

  concurrentState.suspend(fakeApi.get(), () => {
    return {
      age: 20,
      userName: 'Robin',
    };
  });

  try {
    concurrentState.read();

    throw new Error('state was accessible');
  } catch (promise: unknown | Promise<void>) {
    if (!(promise instanceof Promise)) {
      throw new Error('state was not a promise');
    }

    promise.then(() => {
      expect(concurrentState.read()).toEqual({
        age: 20,
        userName: 'Robin',
      });
      done();
    });

    jest.runAllTimers();
  }
});

test('asserts that a concurrentState changes state to accessible with initial state', (done) => {
  const concurrentState = new ConcurrentState<TypicalState>(getTypicalState());

  concurrentState.suspend(fakeApi.get(), () => {
    return {
      age: 20,
      userName: 'Robin',
    };
  });

  try {
    concurrentState.read();

    throw new Error('state was accessible');
  } catch (promise: unknown | Promise<void>) {
    if (!(promise instanceof Promise)) {
      throw new Error('state was not a promise');
    }

    promise.then(() => {
      expect(concurrentState.read()).toEqual({
        age: 20,
        userName: 'Robin',
      });
      done();
    });

    jest.runAllTimers();
  }
});

test('asserts that concurrentState throws the catched error', (done) => {
  const concurrentState = new ConcurrentState<TypicalState>();

  concurrentState.suspend(fakeApi.getError(), () => {
    return {
      age: 20,
      userName: 'Robin',
    };
  });

  try {
    concurrentState.read();

    throw new Error('state was accessible');
  } catch (promise: unknown | Promise<void>) {
    if (!(promise instanceof Promise)) {
      throw new Error('state was not a promise');
    }

    promise.then(() => {
      let thrownError;

      try {
        concurrentState.read();
      } catch (error: unknown) {
        thrownError = error;
      }

      expect(thrownError).toEqual({ error: 'error' });
      done();
    });

    jest.runAllTimers();
  }
});

test('asserts that concurrentState throws the catched error with initial state', (done) => {
  const concurrentState = new ConcurrentState<TypicalState>(getTypicalState());

  concurrentState.suspend(fakeApi.getError(), () => {
    return {
      age: 20,
      userName: 'Robin',
    };
  });

  try {
    concurrentState.read();

    throw new Error('state was accessible');
  } catch (promise: unknown | Promise<void>) {
    if (!(promise instanceof Promise)) {
      throw new Error('state was not a promise');
    }

    promise.then(() => {
      let thrownError;

      try {
        concurrentState.read();
      } catch (error: unknown) {
        thrownError = error;
      }

      expect(thrownError).toEqual({ error: 'error' });
      done();
    });

    jest.runAllTimers();
  }
});

test('asserts that a concurrentState can write (unsafely)', (done) => {
  const concurrentState = new ConcurrentState<TypicalState>(getTypicalState());

  concurrentState.suspend(fakeApi.get(), () => {
    return {
      age: 20,
      userName: 'Robin',
    };
  });

  try {
    concurrentState.read();

    throw new Error('state was accessible');
  } catch (promise: unknown | Promise<void>) {
    if (!(promise instanceof Promise)) {
      throw new Error('state was not a promise');
    }

    promise.then(() => {
      concurrentState.unsafeWrite({
        age: 22,
      });

      expect(concurrentState.read()).toEqual({
        age: 22,
        userName: 'Robin',
      });

      concurrentState.unsafeWrite((data) => ({
        age: data.extract().age + 1,
      }));

      expect(concurrentState.read()).toEqual({
        age: 23,
        userName: 'Robin',
      });

      done();
    });

    jest.runAllTimers();
  }
});

test('asserts that React suspense works', async () => {
  const concurrentState = new ConcurrentState<TypicalState>();

  const { findByText, getByText } = render(<ConcurrentParent state={concurrentState} />);
  expect(getByText(/loading/i)).toBeTruthy();

  concurrentState.suspend(fakeApi.get(), (resolve) => {
    return {
      ...resolve,
      age: 20,
    };
  });

  await findByText(/Jocke/i);
});

test('asserts that React suspense works with initial state', async () => {
  const concurrentState = new ConcurrentState(getTypicalState());

  const { findByText, getByText } = render(<ConcurrentParent state={concurrentState} />);
  expect(getByText(/loading/i)).toBeTruthy();

  concurrentState.suspend(fakeApi.get(), (resolve) => {
    return {
      ...resolve,
      age: 20,
    };
  });

  await findByText(/Jocke/i);
});

test('asserts that gracefulDegradation works', async () => {
  const concurrentState = new ConcurrentState<TypicalState>();

  const { findByText, getByText } = render(<ConcurrentParent state={concurrentState} />);
  expect(getByText(/loading/i)).toBeTruthy();

  concurrentState
    .suspend(fakeApi.getError(), (data) => {
      return {
        age: 20,
        userName: data.userName,
      };
    })
    .gracefulDegradation(async () => {
      return {
        age: 20,
        userName: 'graceful',
      };
    });

  await findByText(/graceful/i);
});

test('asserts that gracefulDegradation works with initial state', async () => {
  const concurrentState = new ConcurrentState(getTypicalState());

  const { findByText, getByText } = render(<ConcurrentParent state={concurrentState} />);
  expect(getByText(/loading/i)).toBeTruthy();

  concurrentState
    .suspend(fakeApi.getError(), (data) => {
      return {
        age: 20,
        userName: data.userName,
      };
    })
    .gracefulDegradation(async () => {
      return {
        age: 20,
        userName: 'graceful',
      };
    });

  await findByText(/graceful/i);
});

test('asserts that gracefulDegradation works', async () => {
  const concurrentState = new ConcurrentState<TypicalState>();

  const { findByText, getByText } = render(
    <ErrorBoundary>
      <ConcurrentParent state={concurrentState} />
    </ErrorBoundary>,
  );
  expect(getByText(/loading/i)).toBeTruthy();

  concurrentState
    .suspend(fakeApi.getError(), (data) => {
      return {
        age: 20,
        userName: data.userName,
      };
    })
    .gracefulDegradation(async () => {
      return new Error('broken');
    });

  await findByText(/broken/i);
});

test('asserts that gracefulDegradation works with initial state', async () => {
  const concurrentState = new ConcurrentState(getTypicalState());

  const { findByText, getByText } = render(
    <ErrorBoundary>
      <ConcurrentParent state={concurrentState} />
    </ErrorBoundary>,
  );
  expect(getByText(/loading/i)).toBeTruthy();

  concurrentState
    .suspend(fakeApi.getError(), (data) => {
      return {
        age: 20,
        userName: data.userName,
      };
    })
    .gracefulDegradation(async () => {
      return new Error('broken');
    });

  await findByText(/broken/i);
});
