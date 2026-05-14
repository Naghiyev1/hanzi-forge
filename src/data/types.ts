export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6

export type HanziEntry = {
  id: string
  character: string
  pinyin: string
  definition: string
  radical: string
  radicalMeta?: string
  strokeCount: number
  hskLevel: HskLevel
  generalStandard?: string
  frequencyRank?: number
  mnemonic?: string
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
