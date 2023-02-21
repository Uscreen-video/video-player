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
  [Action.interacted]: (state) => ({
    ...state,
    isInteracted: true
  }),
  [Action.idle]: (state, params) => ({
    ...state,
    ...params
  }),
  [Action.setLevels]: (state, params) => ({
    ...state,
    ...params
  }),
  [Action.selectTextTrack]: (state, params) => ({
    ...state,
    ...params
  }),
  [Action.cues]: (state, params) => ({
    ...state,
    ...params
  }),
  [Action.setPlaybackRate]: (state, params) => ({
    ...state,
    ...params
  }),
  [Action.setQualityLevel]: (state, params) => ({
    ...state,
    ...params
  }),
}
