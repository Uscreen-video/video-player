import { Context, ContextType, ContextEvent } from '@lit-labs/context'
import { ReactiveController, ReactiveElement } from 'lit';
import { decorateProperty } from '@lit/reactive-element/decorators/base.js';

const isEqual = (a: any, b: any) => {
  if (typeof a !== typeof b) return false
  if (typeof a === 'object') return Object.is(a, b)
  return a === b
}

export class ContextConsumer<
  C extends Context<unknown, unknown>,
  HostElement extends ReactiveElement
> implements ReactiveController
{
  constructor(
    protected host: HostElement,
    private context: C,
    private field?: keyof ContextType<C>,
    private name?: PropertyKey,
  ) {
    this.host.addController(this);
  }

  private unsubscribe?: () => void;

  hostConnected(): void {
    this.dispatchRequest();
  }
  hostDisconnected(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  private dispatchRequest() {
    this.host.dispatchEvent(
      new ContextEvent(
        this.context,
        (value, unsubscribe) => {
          // some providers will pass an unsubscribe function indicating they may provide future values
          if (this.unsubscribe) {
            // if the unsubscribe function changes this implies we have changed provider
            if (this.unsubscribe !== unsubscribe) {
              // cleanup the old provider
              this.unsubscribe();
            }
          }

          const _host = this.host as any
          
          if (!this.field) {
            _host[this.name] = value;
          } else if (
            !isEqual(_host[this.name], value[this.field])
          ) {
            _host[this.name] = value[this.field]
          } else {
            this.unsubscribe = unsubscribe;
            return
          }

          // schedule an update in case this value is used in a template
          this.host.requestUpdate();

          this.unsubscribe = unsubscribe;
        },
        true
      )
    );
  }
}


export function connectConsumer<ValueType>({
  context: context,
  field
}: {
  context: Context<unknown, ValueType>;
  field?: keyof ValueType;
}): <K extends PropertyKey>(
  // Partial<> allows for providing the value to an optional field
  protoOrDescriptor: ReactiveElement & Partial<Record<K, ValueType[typeof field]>>,
  name?: K
  // Note TypeScript requires the return type to be `void|any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => void | any {
  return decorateProperty({
    finisher: (ctor: typeof ReactiveElement, name: PropertyKey) => {
      ctor.addInitializer((element: ReactiveElement): void => {
        new ContextConsumer(
          element,
          context,
          field,
          name
        );
      });
    },
  });
}
