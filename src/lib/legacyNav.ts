// Minimal page type kept for the admin screen, which predates the path router.
export type Page = { name: 'admin' } | { name: 'auth'; mode?: 'signin' | 'signup' | 'update'; next?: Page } | { name: 'home' } | { name: 'request-invite' }
export type Navigate = (page: Page) => void
