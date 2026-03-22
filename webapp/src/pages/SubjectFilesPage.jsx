import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SUBJECT_META } from '../subjectMeta'

function getFileTypeLabel(extension) {
    const ext = (extension || '').toLowerCase()
    if (ext === '.pdf') return 'PDF Document'
    if (ext === '.ppt' || ext === '.pptx') return 'PowerPoint Presentation'
    if (ext === '.doc' || ext === '.docx') return 'Word Document'
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif' || ext === '.webp') return 'Image File'
    if (ext === '.txt') return 'Text File'
    return 'File'
}

function SubjectFilesPage() {
    const { code } = useParams()
    const upperCode = (code || '').toUpperCase()

    const [manifest, setManifest] = useState(null)
    const [error, setError] = useState('')
    const manifestUrl = `${import.meta.env.BASE_URL}data/file-manifest.json`

    useEffect(() => {
        async function loadManifest() {
            try {
                const response = await fetch(manifestUrl)
                if (!response.ok) {
                    throw new Error('Manifest was not found. Run generate-file-manifest.ps1 first.')
                }
                const data = await response.json()
                setManifest(data)
            } catch (err) {
                setError(err.message)
            }
        }

        loadManifest()
    }, [manifestUrl])

    const subject = useMemo(() => {
        if (!manifest?.subjects) {
            return null
        }
        return manifest.subjects.find((item) => item.code.toUpperCase() === upperCode) || null
    }, [manifest, upperCode])

    const meta = SUBJECT_META[upperCode] || {}

    if (error) {
        return (
            <main className="mx-auto w-[94vw] max-w-6xl py-8">
                <section className="rounded-2xl border border-zinc-700 bg-[#111111] p-4 text-red-200">
                    <h2 className="mb-2 text-lg font-bold">Unable to load subject files</h2>
                    <p>{error}</p>
                </section>
            </main>
        )
    }

    if (!manifest) {
        return (
            <main className="mx-auto w-[94vw] max-w-6xl py-8">
                <section className="rounded-2xl border border-zinc-700 bg-[#111111] p-4 text-zinc-100">
                    <h2 className="text-lg font-bold text-red-400">Loading...</h2>
                </section>
            </main>
        )
    }

    if (!subject) {
        return (
            <main className="mx-auto w-[94vw] max-w-6xl py-8">
                <section className="rounded-2xl border border-zinc-700 bg-[#111111] p-4 text-red-200">
                    <h2 className="mb-2 text-lg font-bold">Subject not found</h2>
                    <p>No manifest entry found for {upperCode}.</p>
                    <Link to="/" className="btn-red-outline mt-3 inline-flex px-4 py-2 text-sm">
                        Back to Home
                    </Link>
                </section>
            </main>
        )
    }

    return (
        <main className="mx-auto w-[94vw] max-w-6xl py-8">
            <header className="glass-red animate-rise-in flex flex-wrap items-start justify-between gap-4 rounded-3xl px-5 py-6 sm:px-8">
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-red-400">{meta.icon || '📁'} {subject.code}</p>
                    <h1 className="text-3xl font-extrabold text-white">{meta.title || subject.code}</h1>
                    <p className="mt-2 text-sm text-zinc-400">{meta.subtitle || 'Download and preview available material.'}</p>
                </div>
                <Link className="btn-red-outline px-4 py-2 text-sm" to="/">
                    Back to Home
                </Link>
            </header>

            {subject.groups.map((group) => (
                <section key={group.name} className="mt-6 animate-rise-in">
                    <h2 className="mb-3 text-xl font-bold text-red-400">{group.name}</h2>
                    <div className="grid gap-3">
                        {group.files.map((file) => {
                            const fileUrl = `../${file.relativePath}`
                            return (
                                <article className="glass-red flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4" key={`${group.name}-${file.relativePath}`}>
                                    <div>
                                        <h3 className="text-base font-bold text-zinc-50">{file.displayName}</h3>
                                        <p className="text-sm text-zinc-300">{getFileTypeLabel(file.extension)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a className="btn-red-outline px-4 py-2 text-sm" href={fileUrl} download>
                                            Download
                                        </a>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </section>
            ))}
        </main>
    )
}

export default SubjectFilesPage
