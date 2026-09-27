import { createContext, useContext } from 'react'

export type Lang = 'ar' | 'en'
export const LangContext = createContext<Lang>('ar')
export const useLang = () => useContext(LangContext)
