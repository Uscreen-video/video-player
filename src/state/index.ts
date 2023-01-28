import { createContext } from '@lit-labs/context'
import { ReactiveElement } from 'lit'
import { connectConsumer } from './connector'
import { StateController } from './controller'
import { createCommandListener } from './commander'
import { Command } from './types'
export { dispatch } from './emitter'

export type State = {
  value: number,
  isPlaying: boolean,
}

const initialValue: State = {
  value: 0,
  isPlaying: false
}

export const context = createContext<State>('video-state')
export const connect = (field?: keyof State) => connectConsumer<State>({ context, field })
export const listen = (event: Command) => createCommandListener(event)
export const createState = (host: ReactiveElement) => new StateController(host, context, initialValue)
