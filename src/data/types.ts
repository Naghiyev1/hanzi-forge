export type HskLevel = '1' | '2' | '3' | '4' | '5' | '6' | '7-9'

export type VocabEntry = {
  id: string
  level: HskLevel
  word: string
  pinyin: string
  pos?: string
  definition: string
  also?: string
}

export type CharacterEntry = {
  id: string
  level: HskLevel
  character: string
  examples: Array<{ word: string; pinyin: string; definition: string }>
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

export type ReviewState = {
  id: string
  repetitions: number
  intervalDays: number
  easeFactor: number
  dueAt: string
  lapses: number
  lastGrade?: ReviewGrade
  lastReviewedAt?: string
}
