import type { ReviewState, HskLevel } from '../data/types'
const REVIEW_KEY = 'hanzi-forge.vocab-review-state.v2'
const SETTINGS_KEY = 'hanzi-forge.settings.v2'
export type AppSettings = { selectedLevel: HskLevel; track: 'vocab' | 'characters' }
export function loadReviewStates(): Record<string, ReviewState> { try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}') } catch { return {} } }
export function saveReviewStates(states: Record<string, ReviewState>) { localStorage.setItem(REVIEW_KEY, JSON.stringify(states)) }
export function loadSettings(): AppSettings { try { return { selectedLevel: '1', track: 'vocab', ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') ?? {}) } } catch { return { selectedLevel: '1', track: 'vocab' } } }
export function saveSettings(settings: AppSettings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }
export function resetAllProgress() { localStorage.removeItem(REVIEW_KEY) }
