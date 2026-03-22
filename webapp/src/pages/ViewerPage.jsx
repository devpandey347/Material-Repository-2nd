import { useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

function ViewerPage() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const file = params.get('file')
    const title = params.get('title') || 'Preview'
    const frameRef = useRef(null)
    const isHtmlFile = !!file && /\.html?(?:$|[?#])/i.test(file)

    const mapSemLinkToRoute = useCallback((href) => {
        const match = href.match(/^\/(Sem\d+)\/([^/]+)(?:\/Unit(\d+)\/(notes|mcq|subjective))?\/?$/i)
        if (!match) {
            return null
        }

        const sem = match[1]
        const code = match[2]
        const unit = match[3]
        const kind = (match[4] || '').toLowerCase()

        if (!unit) {
            return `/notes/${encodeURIComponent(sem)}/${encodeURIComponent(code)}`
        }

        const fileKind = kind === 'mcq' ? 'mcq' : 'notes'
        const filePath = `${import.meta.env.BASE_URL}scraped_data/${sem}/${code}/Unit${unit}_${fileKind}.html`
        const fileTitle = `${code} Unit ${unit} ${fileKind === 'mcq' ? 'MCQ' : 'Notes'}`

        return `/viewer?file=${encodeURIComponent(filePath)}&title=${encodeURIComponent(fileTitle)}`
    }, [])

    const rewriteEmbeddedLinks = useCallback(() => {
        const frame = frameRef.current
        if (!frame) {
            return
        }

        let doc
        try {
            doc = frame.contentDocument || frame.contentWindow?.document
        } catch {
            return
        }

        if (!doc) {
            return
        }

        // Remove TOC block from embedded notes to keep page content clean and consistent.
        const tocContainer = doc.getElementById('toc-container')
        if (tocContainer) {
            tocContainer.remove()
        }

        const links = doc.querySelectorAll('a[href]')
        links.forEach((link) => {
            const href = (link.getAttribute('href') || '').trim()
            if (!href) {
                return
            }

            if (href.startsWith('/Sem')) {
                const appRoute = mapSemLinkToRoute(href)
                if (appRoute) {
                    link.setAttribute('href', `${import.meta.env.BASE_URL}#${appRoute}`)
                    link.onclick = (event) => {
                        event.preventDefault()
                        navigate(appRoute)
                    }
                }
            }

            link.setAttribute('target', '_self')
        })
    }, [mapSemLinkToRoute, navigate])

    return (
        <main className="flex min-h-screen flex-col bg-black/70">
            <header className="glass-red m-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
                <h1 className="text-base font-bold text-zinc-100 sm:text-lg">{title}</h1>
                <div className="flex gap-2">
                    <button
                        className="btn-red-outline px-4 py-2 text-sm"
                        type="button"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </button>
                    {file && !isHtmlFile ? (
                        <a className="btn-red-outline px-4 py-2 text-sm" href={file} download>
                            Download
                        </a>
                    ) : null}
                </div>
            </header>

            {file ? (
                <iframe
                    className="mx-3 mb-3 h-[calc(100vh-92px)] w-[calc(100%-24px)] rounded-2xl border border-red-500/30 bg-white"
                    ref={frameRef}
                    src={file}
                    title={title}
                    onLoad={rewriteEmbeddedLinks}
                />
            ) : (
                <section className="mx-3 mt-3 rounded-2xl border border-zinc-700 bg-[#111111] p-4 text-red-200">
                    <h2 className="mb-1 text-lg font-bold">No file selected</h2>
                    <p>Open this page with a valid file query parameter.</p>
                </section>
            )}
        </main>
    )
}

export default ViewerPage
