import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SUBJECT_META } from '../subjectMeta'

function getNotesRouteFromHref(href) {
    if (!href) {
        return null
    }

    // New-style links already point to the React hash route from index.html.
    const hashIndex = href.indexOf('#/notes/')
    if (hashIndex !== -1) {
        return href.slice(hashIndex + 1)
    }

    if (!href.includes('subjects/subject.html?')) {
        return null
    }

    const queryIndex = href.indexOf('?')
    if (queryIndex === -1) {
        return null
    }

    const query = href.slice(queryIndex + 1)
    const params = new URLSearchParams(query)
    const code = params.get('code') || ''
    const sem = params.get('sem') || ''
    const name = params.get('name') || code

    if (!code || !sem) {
        return null
    }

    const cleanCode = code.toUpperCase()
    return `/notes/${encodeURIComponent(sem)}/${encodeURIComponent(cleanCode)}?name=${encodeURIComponent(name)}`
}

function HomePage() {
    const [manifest, setManifest] = useState(null)
    const [catalog, setCatalog] = useState(null)
    const [error, setError] = useState('')
    const [showNotice, setShowNotice] = useState(false)
    const manifestUrl = `${import.meta.env.BASE_URL}data/file-manifest.json`
    const catalogUrl = `${import.meta.env.BASE_URL}data/home-catalog.json`

    useEffect(() => {
        async function loadManifest() {
            try {
                const [manifestResponse, catalogResponse] = await Promise.all([
                    fetch(manifestUrl),
                    fetch(catalogUrl),
                ])

                if (!manifestResponse.ok) {
                    throw new Error('Manifest was not found. Run generate-file-manifest.ps1 first.')
                }

                if (!catalogResponse.ok) {
                    throw new Error('Home catalog was not found. Ensure data/home-catalog.json exists in webapp/public.')
                }

                const [manifestData, catalogData] = await Promise.all([
                    manifestResponse.json(),
                    catalogResponse.json(),
                ])

                setManifest(manifestData)
                setCatalog(catalogData)
            } catch (err) {
                setError(err.message)
            }
        }

        loadManifest()
    }, [manifestUrl, catalogUrl])

    const fileSubjectMap = useMemo(() => {
        if (!manifest?.subjects) {
            return new Map()
        }

        return new Map(manifest.subjects.map((subject) => {
            const meta = SUBJECT_META[subject.code] || {}
            return [subject.code.toUpperCase(), {
                ...subject,
                icon: meta.icon || '📚',
                title: meta.title || subject.code,
                subtitle: meta.subtitle || 'Study resources',
            }]
        }))
    }, [manifest])

    const semesters = useMemo(() => {
        if (!catalog?.semesters) {
            return []
        }

        return catalog.semesters.map((semester) => ({
            ...semester,
            subjects: (semester.subjects || []).map((subject) => {
                const codeKey = (subject.code || '').toUpperCase()
                const fileSubject = fileSubjectMap.get(codeKey)
                const fileCount = (fileSubject?.groups || []).reduce((total, group) => total + (group.files || []).length, 0)
                const legacyHref = subject.href?.startsWith('subjects/') ? `/${subject.href}` : subject.href
                const notesRoute = getNotesRouteFromHref(subject.href)

                return {
                    ...subject,
                    isFileSubject: !!fileSubject,
                    isNotesSubject: !fileSubject && !!notesRoute,
                    browseHref: fileSubject ? `/subject/${codeKey}` : (notesRoute || legacyHref),
                    icon: fileSubject?.icon || '📘',
                    fileCount,
                    hasStudyMaterial: !!fileSubject?.groups?.some((group) =>
                        (group.files || []).some((file) => {
                            const ext = (file.extension || '').toLowerCase()
                            return ext === '.pdf' || ext === '.ppt' || ext === '.pptx'
                        }),
                    ),
                }
            }),
        }))
    }, [catalog, fileSubjectMap])

    const allSubjects = useMemo(() => {
        return semesters.flatMap((semester) =>
            (semester.subjects || []).map((subject) => {
                return {
                    ...subject,
                    semester: semester.title,
                }
            }),
        )
    }, [semesters])

    const totalFileCount = useMemo(() => {
        return allSubjects.reduce((sum, subject) => sum + (subject.fileCount || 0), 0)
    }, [allSubjects])

    return (
        <main>
            <header className="fixed left-0 top-0 z-30 w-full border-b border-zinc-800 bg-black/85 backdrop-blur-sm">
                <div className="mx-auto flex w-[94vw] max-w-7xl items-center justify-between py-4">
                    <p className="text-lg font-extrabold uppercase tracking-[0.12em] text-white">Dev Pandey</p>
                    <button
                        type="button"
                        onClick={() => setShowNotice((prev) => !prev)}
                        className="btn-red-outline animate-pulse-border rounded-full px-4 py-2 text-xs sm:text-sm"
                    >
                        Notice Section
                    </button>
                </div>
            </header>

            <section className="relative overflow-hidden px-5 pb-10 pt-28 text-center sm:px-8 sm:pt-32">
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,0,0,0.18)_0%,rgba(255,0,0,0)_70%)]" />
                <p className="relative z-10 text-xs font-bold uppercase tracking-[0.25em] text-red-500">Notes Sharing</p>
                <h1 className="relative z-10 mt-3 pb-1 leading-[1.15] bg-[linear-gradient(135deg,#ffffff_0%,#ff0000_50%,#ffffff_100%)] bg-[length:200%_auto] bg-clip-text text-4xl font-extrabold text-transparent sm:text-6xl">
                    Material Repository 2nd
                </h1>
                <p className="relative z-10 mx-auto mt-4 max-w-3xl text-base text-zinc-300 sm:text-xl">
                    Everything you need for your exams, all in one place
                </p>
                <p className="relative z-10 mt-6 text-sm text-zinc-400">
                    {totalFileCount} files across {allSubjects.length} subjects
                </p>
                {showNotice && (
                    <div className="relative z-10 mx-auto mt-6 max-w-3xl rounded-xl border border-zinc-700 bg-[#111111] px-4 py-3 text-sm text-zinc-200">
                        Few subjects do not contain PPT or PDF files and are intentionally non star marked.
                    </div>
                )}
            </section>

            <div className="mx-auto w-[94vw] max-w-7xl pb-10">
                {error && (
                    <section className="mb-6 rounded-xl border border-zinc-700 bg-[#111111] p-4 text-sm text-red-200">
                        <h2 className="mb-2 text-lg font-bold">Data missing</h2>
                        <p className="mb-2">{error}</p>
                        <p className="text-red-200">
                            Run <code>./generate-file-manifest.ps1</code> from the project root and confirm <code>webapp/public/data/home-catalog.json</code> is present.
                        </p>
                    </section>
                )}

                {!!semesters.length && (
                    <section className="space-y-8">
                        {semesters.map((semester) => (
                            <div key={semester.title}>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-red-500">{semester.title}</h2>
                                    <span className="rounded-full border border-zinc-700 bg-[#111111] px-3 py-1 text-xs font-semibold text-zinc-300">
                                        {(semester.subjects || []).length} subjects
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {(semester.subjects || []).map((subject) => {
                                        const hasNotesOrFiles = subject.fileCount > 0 || subject.isNotesSubject || subject.isFileSubject
                                        const badgeText = subject.fileCount > 0
                                            ? `${subject.fileCount} files`
                                            : subject.isNotesSubject
                                                ? 'Notes Available'
                                                : subject.isFileSubject
                                                    ? 'Files Available'
                                                    : hasNotesOrFiles
                                                        ? 'Available'
                                                        : 'Coming Soon'

                                        return (
                                            <article className="glass-red relative animate-rise-in p-6" key={`${semester.title}-${subject.code}-${subject.name}`}>
                                                <p className="absolute right-4 top-4 rounded-full border border-red-500 bg-red-950 px-3 py-1 text-xs font-semibold text-white">
                                                    {badgeText}
                                                </p>

                                                <h3 className="mt-5 text-2xl font-bold text-white">
                                                    {subject.code} {subject.hasStudyMaterial ? <span className="text-yellow-300">★</span> : null}
                                                </h3>
                                                <p className="mt-4 min-h-12 text-sm text-zinc-400">{subject.name}</p>

                                                {subject.isFileSubject ? (
                                                    <Link to={subject.browseHref} className="btn-red-outline mt-6 inline-flex px-4 py-2 text-sm">
                                                        Browse Files
                                                    </Link>
                                                ) : subject.isNotesSubject ? (
                                                    <Link to={subject.browseHref} className="btn-red-outline mt-6 inline-flex px-4 py-2 text-sm">
                                                        {subject.label || 'Browse Notes'}
                                                    </Link>
                                                ) : (
                                                    <a href={subject.browseHref} className="btn-red-outline mt-6 inline-flex px-4 py-2 text-sm">
                                                        {subject.label || 'Browse Notes'}
                                                    </a>
                                                )}
                                            </article>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </section>
                )}
            </div>

            <footer className="mt-8 border-t-2 border-red-600 bg-[linear-gradient(180deg,#000000_0%,#0a0a0a_100%)] px-5 py-10 text-center sm:px-8">
                <div className="mx-auto max-w-3xl">
                    <h3 className="text-2xl font-bold text-red-500">Dev's Material Repository</h3>
                    <p className="mt-3 text-zinc-300">Happy studying! If these notes helped you, share them with your friends.</p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                        <a
                            className="btn-red-outline inline-flex rounded-full px-6 py-3 text-sm"
                            href="https://devprotfolio-aavuiqxvf-dev-pandeys-projects-24e9f338.vercel.app/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Visit My Portfolio
                        </a>
                        <a
                            className="inline-flex rounded-full border border-[#25d366] bg-[#25d366] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#1da955]"
                            href="https://chat.whatsapp.com/ElGakQUGGa1IMam5FlAiqw"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Join WhatsApp Community
                        </a>
                    </div>
                    <p className="mt-6 border-t border-zinc-800 pt-4 text-xs text-zinc-500">© 2026 Dev Pandey | All Rights Reserved</p>
                </div>
            </footer>
        </main>
    )
}

export default HomePage
