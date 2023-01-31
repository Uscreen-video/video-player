import { Action, State } from '../types'

export const stateMapper: Partial<Record<Action, (s: State, v: any) => State>> = {
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
  }),
  [Action.updateTime]: (state, params) => ({
    ...state,
    ...params
  }),
  [Action.updateDuration]: (state, params) => ({
    ...state,
    ...params
  }),
  [Action.init]: (state, params) => ({
    ...state,
    ...params
  }),
  [Action.volumeChange]: (state, params) => ({
    ...state,
    ...params
  }),
  [Action.fullscreenChange]: (state, params) => ({
    ...state,
    ...params
  }),
}
