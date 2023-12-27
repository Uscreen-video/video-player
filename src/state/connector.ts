import { Context, ContextType, ContextEvent } from '@lit/context'
import { ReactiveController, ReactiveElement } from 'lit';
import { type Interface } from '@lit/reactive-element/decorators/base';

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

  connected = false;

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
    const event = new ContextEvent(
      this.context,
      (value, unsubscribe) => {
        this.connected = true
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

        this.host.requestUpdate();
        this.unsubscribe = unsubscribe;
      },
      true
    )
  
    this.host.dispatchEvent(event)

    Promise.resolve().then(() => {
      if (!this.connected) this.host.dispatchEvent(event)
    })   
  }
}

export type ContextDecorator = {
  // accessor decorator signature
  <C extends Interface<ReactiveElement>, V>(
    target: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): ClassAccessorDecoratorResult<C, V>;

  // setter decorator signature
  <C extends Interface<ReactiveElement>, V>(
    target: (value: V) => void,
    context: ClassSetterDecoratorContext<C, V>
  ): (this: C, value: V) => void;

  // legacy decorator signature
  (
    protoOrDescriptor: Object,
    name: PropertyKey,
    descriptor?: PropertyDescriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any;
};


export function connectConsumer<ValueType>({
  context: context,
  field
}: {
  context: Context<unknown, ValueType>;
  field?: keyof ValueType;
}): ContextDecorator {
  return <C extends Interface<ReactiveElement>, V>(
    protoOrTarget:
      | object
      | ClassAccessorDecoratorTarget<C, V>
      | ((value: V) => void),
    nameOrContext:
      | PropertyKey
      | ClassAccessorDecoratorContext<C, V>
      | ClassSetterDecoratorContext<C, V>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => {
    const ctor = protoOrTarget.constructor as typeof ReactiveElement;
    ctor.addInitializer((element: ReactiveElement): void => {
      new ContextConsumer(
        element,
        context,
        field,
        nameOrContext as string
      );
    });
  }
}
