import type { ReviewState } from '../data/types'

const REVIEW_KEY = 'hanzi-forge.review-state.v1'
const SETTINGS_KEY = 'hanzi-forge.settings.v1'

export type AppSettings = { unlockedLevel: number; selectedLevel: number; revealPinyinFirst: boolean }

export function loadReviewStates(): Record<string, ReviewState> {
  try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}') } catch { return {} }
}
export function saveReviewStates(states: Record<string, ReviewState>) { localStorage.setItem(REVIEW_KEY, JSON.stringify(states)) }
export function loadSettings(): AppSettings {
  try { return { unlockedLevel: 1, selectedLevel: 1, revealPinyinFirst: false, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') ?? {}) } }
  catch { return { unlockedLevel: 1, selectedLevel: 1, revealPinyinFirst: false } }
}
export function saveSettings(settings: AppSettings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }
export function resetAllProgress() { localStorage.removeItem(REVIEW_KEY) }
