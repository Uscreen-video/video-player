
import { ContextProvider } from '@lit-labs/context';
import { context } from './index'
import { UPDATE_STATE, StateAction } from './emitter';
import { mapState } from './events';

type Context = typeof context

export class StateController extends ContextProvider<Context> {
  hostConnected() {
    this.host.addEventListener(UPDATE_STATE, this.handleEvent)
  }

  hostDisconnected() {
    this.host.removeEventListener(UPDATE_STATE, this.handleEvent)
  }

  handleEvent = (e: CustomEvent<StateAction>) => {
    e.stopPropagation()
    this.setValue(mapState(e.detail.action, this.value, e.detail.params))
  }
}
