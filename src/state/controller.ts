
import { ContextProvider } from '@lit-labs/context';
import { context } from './index'
import { StateAction } from './emitter';
import { mapState } from './events';
import { Event } from './types';

type Context = typeof context

export class StateController extends ContextProvider<Context> {
  hostConnected() {
    this.host.addEventListener(Event.state, this.handleEvent)
    this.host.addEventListener(Event.register, this.handleRootRegistration)
  }

  hostDisconnected() {
    this.host.removeEventListener(Event.state, this.handleEvent)
    this.host.removeEventListener(Event.register, this.handleRootRegistration)
  }

  handleEvent = (e: CustomEvent<StateAction>) => {
    e.stopPropagation()
    this.setValue(mapState(e.detail.action, this.value, e.detail.params))
  }

  handleRootRegistration = (e: CustomEvent) => {
    console.log('registered')
    e.stopPropagation()
    e.detail.callback?.(this.host)
  }
}
