import { createContext } from '@lit-labs/context'
import { ReactiveElement } from 'lit'
import { connectConsumer } from './connector'
import { StateController } from './controller'
import { createCommandListener } from './commander'
import { Command, State } from '../types'
export { dispatch } from './dispatcher'
export { createCommand } from './commander'
export * as Types from '../types'

const initialValue: State = {
  isPlaying: false,
  isInteracted: false,
  idle: false,
  canPlay: true,
  cues: [],
  airplayAvailable: Boolean((window as any).WebKitPlaybackTargetAvailabilityEvent),
}

export const context = createContext<State>('video-state')
export const connect = (field?: keyof State) => connectConsumer<State>({ context, field })

/**
 * A decorator that creates a command listener.  
 * If dependencies are provided, the command will only be executed if all dependencies are met.
 */
export const listen = (command: Command, dependencies?: State) => createCommandListener(command, dependencies)
export const createState = (host: ReactiveElement) => new StateController(host, context, initialValue)
