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
  value: 0,
  isPlaying: false
}

export const context = createContext<State>('video-state')
export const connect = (field?: keyof State) => connectConsumer<State>({ context, field })
export const listen = (event: Command, dependencies?: State) => createCommandListener(event, dependencies)
export const createState = (host: ReactiveElement) => new StateController(host, context, initialValue)
