import { State } from "."
import { Action } from './types'

export const stateMapper: Record<Action, (s: State, v: any) => State> = {
  [Action.toggle]: (state) => ({
    ...state,
    isPlaying: !state.isPlaying
  }),
  [Action.play]: (state) => ({
    ...state,
    isPlaying: true
  }),
  [Action.pause]: (state) => ({
    ...state,
    isPlaying: false
  })
}
