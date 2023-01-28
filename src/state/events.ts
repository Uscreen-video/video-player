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
