import {
  IconFileText, IconFilePencil, IconTrash, IconFolderSearch, IconTerminal2, IconBrain,
  IconGlobe, IconArrowsRightLeft, IconTool,
} from '@tabler/icons-react'
import type { ToolKind } from '@/types'

type TablerIcon = typeof IconTool

const kindIcons: Record<ToolKind, TablerIcon> = {
  read: IconFileText,
  edit: IconFilePencil,
  delete: IconTrash,
  move: IconArrowsRightLeft,
  search: IconFolderSearch,
  execute: IconTerminal2,
  think: IconBrain,
  fetch: IconGlobe,
  switch_mode: IconArrowsRightLeft,
  other: IconTool,
}

/** Check if a tool call represents a file mutation (edit, delete, move) */
export function isFileMutation(kind?: ToolKind, title?: string): boolean {
  if (kind === 'edit' || kind === 'delete' || kind === 'move') return true
  if (kind) return false
  const t = (title ?? '').toLowerCase()
  return t.includes('edit') || t.includes('write') || t.includes('patch') || t.includes('delet') || t.includes('mov') || t.includes('renam')
}

export function getToolIcon(kind?: ToolKind, title?: string): TablerIcon {
  if (kind && kindIcons[kind]) return kindIcons[kind]
  const t = (title ?? '').toLowerCase()
  if (t.includes('bash') || t.includes('command') || t.includes('exec') || t.includes('shell')) return IconTerminal2
  if (t.includes('read') || t.includes('cat') || t.includes('view')) return IconFileText
  if (t.includes('write') || t.includes('edit') || t.includes('patch')) return IconFilePencil
  if (t.includes('search') || t.includes('grep') || t.includes('find') || t.includes('glob')) return IconFolderSearch
  if (t.includes('fetch') || t.includes('web') || t.includes('http')) return IconGlobe
  if (t.includes('think')) return IconBrain
  return IconTool
}
