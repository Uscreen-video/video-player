
import { ContextProvider } from '@lit-labs/context';
import { context } from './index'
import { StateAction } from './dispatcher';
import { stateMapper } from './mapper';
import { Action, Event, State } from './types';

type Context = typeof context

export const mapState = (
  action: Action,
  state: State,
  value: any
): State => {
  if (!stateMapper[action]) {
    console.warn(`${action} not found`)
    return state
  }
  return stateMapper[action](state, value)
}

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
    e.stopPropagation()
    e.detail.callback?.(this.host)
  }
}
