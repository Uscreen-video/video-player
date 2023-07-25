import { State } from '../types'


export type StorageValue = Partial<Pick<State,
  'isMuted' | 
  'volume' |
  'activeQualityLevel' |
  'activeTextTrack' |
  'playbackRate'
>>

export type StorageProvider = {
  get: () => StorageValue,
  set: (val: StorageValue) => void,
  clear: () => void
}

export const createProvider = (key?: string): StorageProvider => {
  const Provider: StorageProvider = {
    get: () => {
      if (!key) return {}
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : {} 
    },
    set: (val) => {
      if (!key) return
      window.localStorage.setItem(key, JSON.stringify(val))
    },
    clear: () => {
      if (!key) return
      window.localStorage.removeItem(key)
    }
  }

  return Provider
}