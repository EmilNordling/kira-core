import { Flow, FlowState } from './flow_state';
import { MutationFn, ValidStateData } from './_data_struct';

type Disposer = () => void;

export class ConcurrentState<T extends ValidStateData> {
  private readonly state: FlowState<T>;
  private suspender: Promise<void> | null = null;
  private error: unknown | null = null;

  constructor(initialState?: T) {
    this.state = new FlowState({
      initialState,
      designatedFlowState: Flow.UNSET,
    });
  }

  public read(): T {
    if (this.state.flowState === Flow.ACCESSIBLE) {
      return this.state.peekState();
    }

    if (this.state.flowState === Flow.ERROR) {
      throw this.error;
    }

    throw this.createPromise();
  }

  public suspend<K>(promise: Promise<T>): void;
  public suspend<K>(promise: Promise<K>, parseFn: (data: K) => T): void;
  public suspend<K>(promise: Promise<K>, parseFn?: (data: K) => T): void {
    this.createPromise();
    this.error = null;
    this.state.flowState = Flow.PENDING;

    promise.then(
      (response) => {
        const fn = (): T | K => (parseFn ? parseFn(response) : response);

        try {
          this.state.write(fn);
        } catch (error: unknown) {
          this.state.overwriteData(fn() as T);
          this.state.changeFlowTo(Flow.ACCESSIBLE);
        }
      },
      (error: unknown) => {
        this.error = error;
        this.state.changeFlowTo(Flow.ERROR);
      },
    );
  }

  public write(currentState: MutationFn<T>): void {
    // TODO
    // This write needs be added to a queue or lock other writes to not have
    // issues with concurrency

    this.state.write(currentState);
  }

  public subscribe(event: () => void): Disposer {
    return this.state.subscribe(event);
  }

  private createPromise(): Promise<void> {
    if (!this.suspender) {
      this.suspender = new Promise<void>((resolve) => {
        const disposer = this.state.subscribe(() => {
          switch (this.state.flowState) {
            case Flow.UNSET:
            case Flow.PENDING:
              break;
            default: {
              disposer();
              resolve();
              this.suspender = null;
            }
          }
        });
      });
    }

    return this.suspender;
  }
}

export function createConcurrentState<T extends ValidStateData>(initialState?: T): ConcurrentState<T> {
  const concurrentState = new ConcurrentState<T>(initialState);

  return concurrentState;
}