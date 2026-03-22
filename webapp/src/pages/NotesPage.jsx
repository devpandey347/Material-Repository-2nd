import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

function NotesPage() {
    const routeParams = useParams()
    const [params] = useSearchParams()
    const [catalog, setCatalog] = useState(null)
    const [error, setError] = useState('')

    const sem = (routeParams.sem || params.get('sem') || '').trim()
    const code = (routeParams.code || params.get('code') || '').trim().toUpperCase()
    const requestedName = (params.get('name') || '').trim()

    useEffect(() => {
        async function loadCatalog() {
            try {
                const url = `${import.meta.env.BASE_URL}data/notes-catalog.json`
                const response = await fetch(url)
                if (!response.ok) {
                    throw new Error('Notes catalog missing. Run generate-notes-catalog.ps1 first.')
                }
                const data = await response.json()
                setCatalog(data)
            } catch (err) {
                setError(err.message)
            }
        }

        loadCatalog()
    }, [])

    const subject = useMemo(() => {
        if (!catalog?.subjects || !sem || !code) {
            return null
        }

        return catalog.subjects[`${sem}_${code}`] || null
    }, [catalog, sem, code])

    const displayName = subject?.name || requestedName || code || 'Subject Notes'

    return (
        <main className="mx-auto w-[94vw] max-w-6xl py-8">
            <header className="glass-red animate-rise-in flex flex-wrap items-start justify-between gap-4 rounded-3xl px-5 py-6 sm:px-8">
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-red-400">{sem || 'Semester'}</p>
                    <h1 className="text-3xl font-extrabold text-white">{code || 'Subject'}</h1>
                    <p className="mt-2 text-sm text-zinc-400">{displayName}</p>
                </div>
                <div className="flex gap-2">
                    <Link className="btn-red-outline px-4 py-2 text-sm" to="/">
                        Back to Home
                    </Link>
                </div>
            </header>

            {error && (
                <section className="mt-6 rounded-2xl border border-zinc-700 bg-[#111111] p-4 text-red-200">
                    <h2 className="mb-1 text-lg font-bold">Unable to load notes catalog</h2>
                    <p>{error}</p>
                </section>
            )}

            {!error && !catalog && (
                <section className="mt-6 rounded-2xl border border-zinc-700 bg-[#111111] p-4 text-zinc-100">
                    <h2 className="text-lg font-bold text-red-400">Loading subject units...</h2>
                </section>
            )}

            {!error && catalog && !subject && (
                <section className="mt-6 rounded-2xl border border-zinc-700 bg-[#111111] p-4 text-red-200">
                    <h2 className="mb-1 text-lg font-bold">Subject not found</h2>
                    <p>No notes data found for {sem}_{code}.</p>
                </section>
            )}

            {!!subject && (
                <section className="mt-6 animate-rise-in">
                    <h2 className="text-xl font-bold text-red-400">Study Units</h2>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{subject.desc}</p>
                    <div className="mt-4 grid gap-3">
                        {(subject.units || []).map((unitName, index) => {
                            const unit = index + 1
                            const notesFile = `${import.meta.env.BASE_URL}scraped_data/${sem}/${code}/Unit${unit}_notes.html`
                            const mcqFile = `${import.meta.env.BASE_URL}scraped_data/${sem}/${code}/Unit${unit}_mcq.html`

                            return (
                                <article className="glass-red flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4" key={`${sem}-${code}-unit-${unit}`}>
                                    <div>
                                        <h3 className="text-base font-bold text-zinc-50">Unit {unit}: {unitName}</h3>
                                        <p className="text-sm text-zinc-300">Notes and MCQ practice</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            className="btn-red-outline px-4 py-2 text-sm"
                                            to={`/viewer?file=${encodeURIComponent(notesFile)}&title=${encodeURIComponent(`${code} Unit ${unit} Notes`)}`}
                                        >
                                            Notes
                                        </Link>
                                        <Link
                                            className="btn-red-outline px-4 py-2 text-sm"
                                            to={`/viewer?file=${encodeURIComponent(mcqFile)}&title=${encodeURIComponent(`${code} Unit ${unit} MCQ`)}`}
                                        >
                                            MCQs
                                        </Link>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </section>
            )}
        </main>
    )
}

export default NotesPage