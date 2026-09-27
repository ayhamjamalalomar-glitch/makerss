import { useLang as useLangCtx } from './lib/i18n'

export type Lang = 'ar' | 'en'
/** Current language code. Thin wrapper over the app-wide language provider. */
export const useLang = (): Lang => useLangCtx().lang
