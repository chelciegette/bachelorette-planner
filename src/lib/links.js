// Shareable URLs. The app routes on the URL hash (#/…), which is what makes it
// work on GitHub Pages and other static hosts without any server config.

const base = () => `${window.location.origin}${window.location.pathname}`

/** The link you send to the bridesmaids. */
export const shareUrl = () => base()

/** A bridesmaid's personal edit link. */
export const editUrl = (code) => `${base()}#/edit/${encodeURIComponent(code)}`
