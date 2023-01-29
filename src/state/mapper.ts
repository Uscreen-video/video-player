import { Action, State } from './types'

export const stateMapper: Record<Action, (s: State, v: any) => State> = {
  [Action.toggleMuted]: (state) => ({
    ...state,
    isMuted: !state.isMuted
  }),
  [Action.play]: (state) => ({
    ...state,
    isPlaying: true
  }),
  [Action.pause]: (state) => ({
    ...state,
    isPlaying: false
  }),
  [Action.update]: (state, params) => ({
    ...state,
    ...params
  })
}
