declare module 'hanzi-writer' {
  export type HanziWriterOptions = { width?: number; height?: number; padding?: number; showOutline?: boolean; showCharacter?: boolean; strokeAnimationSpeed?: number; delayBetweenStrokes?: number; radicalColor?: string; outlineColor?: string; strokeColor?: string; drawingColor?: string; drawingWidth?: number }
  export default class HanziWriter {
    static create(element: string | HTMLElement, character: string, options?: HanziWriterOptions): HanziWriter
    animateCharacter(): Promise<void>
    quiz(options?: { onMistake?: (strokeData: unknown) => void; onCorrectStroke?: (strokeData: unknown) => void; onComplete?: (summaryData: unknown) => void; showHintAfterMisses?: number | false; highlightOnComplete?: boolean }): void
    cancelQuiz(): void
    showCharacter(): Promise<void>
    hideCharacter(): Promise<void>
    setCharacter(character: string): Promise<void>
  }
}
