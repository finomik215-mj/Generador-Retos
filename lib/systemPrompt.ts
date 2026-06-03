import fs from 'fs'
import path from 'path'

export function getSystemPrompt(): string {
  const filePath = path.join(process.cwd(), 'instrucciones-generador-retos.md')
  return fs.readFileSync(filePath, 'utf-8')
}
