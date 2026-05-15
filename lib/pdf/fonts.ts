import 'server-only'
import { Font } from '@react-pdf/renderer'
import fs from 'fs'
import path from 'path'

let cjkAvailable = false

export function ensureFontsRegistered() {
  if (cjkAvailable) return

  const dir = path.join(process.cwd(), 'public', 'fonts')
  const regular = path.join(dir, 'NotoSansSC-Regular.ttf')
  const bold = path.join(dir, 'NotoSansSC-Bold.ttf')

  if (!fs.existsSync(regular)) return

  Font.register({
    family: 'NotoSansSC',
    fonts: [
      { src: regular },
      { src: fs.existsSync(bold) ? bold : regular, fontWeight: 'bold' },
    ],
  })
  cjkAvailable = true
}

export function getFontFamily() {
  return cjkAvailable ? 'NotoSansSC' : 'Helvetica'
}

export function getFontBold() {
  return cjkAvailable ? 'NotoSansSC' : 'Helvetica-Bold'
}
