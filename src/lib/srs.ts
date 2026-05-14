import type { ReviewGrade, ReviewState } from '../data/types'
const MINUTES = 60 * 1000
const DAYS = 24 * 60 * MINUTES
export function defaultReviewState(id: string): ReviewState { return { id, repetitions: 0, intervalDays: 0, easeFactor: 2.5, dueAt: new Date().toISOString(), lapses: 0 } }
export function isDue(state?: ReviewState) { return !state || new Date(state.dueAt).getTime() <= Date.now() }
export function gradeReview(previous: ReviewState | undefined, grade: ReviewGrade, id: string): ReviewState {
  const state = previous ?? defaultReviewState(id)
  const now = new Date(); let repetitions = state.repetitions; let intervalDays = state.intervalDays || 0; let easeFactor = state.easeFactor || 2.5; let lapses = state.lapses || 0; let dueAt = new Date(now)
  if (grade === 'again') { repetitions = 0; intervalDays = 0; easeFactor = Math.max(1.3, easeFactor - 0.25); lapses += 1; dueAt = new Date(now.getTime() + 10 * MINUTES) }
  if (grade === 'hard') { repetitions = Math.max(1, repetitions); intervalDays = Math.max(1, Math.round((intervalDays || 1) * 1.2)); easeFactor = Math.max(1.3, easeFactor - 0.15); dueAt = new Date(now.getTime() + intervalDays * DAYS) }
  if (grade === 'good') { repetitions += 1; intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.round(intervalDays * easeFactor); dueAt = new Date(now.getTime() + intervalDays * DAYS) }
  if (grade === 'easy') { repetitions += 1; easeFactor = Math.min(3.0, easeFactor + 0.15); intervalDays = repetitions === 1 ? 4 : Math.round(Math.max(7, intervalDays * easeFactor * 1.3)); dueAt = new Date(now.getTime() + intervalDays * DAYS) }
  return { ...state, id, repetitions, intervalDays, easeFactor, dueAt: dueAt.toISOString(), lapses, lastGrade: grade, lastReviewedAt: now.toISOString() }
}
