// frontend/src/sections/HowItWorksSection.jsx

import { useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

// ─── Fade-up wrapper — triggers when element scrolls into view ────────────────
function FadeUp({ children, delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

// ─── Section label pill ───────────────────────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <div style={{
      display: 'inline-block',
      fontFamily: "'DM Mono', monospace",
      fontSize: '10px',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: '#555',
      border: '1px solid #2a2a2a',
      padding: '5px 14px',
      borderRadius: '100px',
      marginBottom: '16px',
    }}>
      {text}
    </div>
  )
}

// ─── Section header block ─────────────────────────────────────────────────────
function SectionHeader({ label, title, sub }) {
  return (
    <FadeUp>
      <div style={{ textAlign: 'center', marginBottom: '52px' }}>
        <SectionLabel text={label} />
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(24px, 4vw, 38px)',
          fontWeight: 800,
          color: '#f0f0f0',
          letterSpacing: '-0.03em',
          margin: '0 0 10px',
          lineHeight: 1.1,
        }}>
          {title}
        </h2>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '13px',
          color: '#555',
          lineHeight: 1.7,
          margin: 0,
        }}>
          {sub}
        </p>
      </div>
    </FadeUp>
  )
}

// ─── BLOCK 1: Contrast ────────────────────────────────────────────────────────
function ContrastBlock() {
  const items = {
    bad: [
      'Answers from the entire internet — not your syllabus',
      'Confidently fabricates citations, page numbers, and facts',
      'No way to verify where the answer actually came from',
      'Your file is mixed with billions of tokens of general knowledge',
    ],
    good: [
      'Reads only from the PDF you uploaded — nothing else',
      'If it\'s not in your file, it says so — zero hallucinations',
      'Hybrid search finds exact keywords AND semantic meaning',
      'Cross-encoder reranks results for maximum answer precision',
    ],
  }

  return (
    <FadeUp delay={0.05}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        border: '1px solid #2a2a2a',
        borderRadius: '16px',
        overflow: 'hidden',
        maxWidth: '820px',
        margin: '0 auto',
      }}>
        {/* Left — Generic AI */}
        <div style={{
          padding: '32px 28px',
          background: '#0f0f0f',
          borderRight: '1px solid #2a2a2a',
        }}>
          <span style={{
            display: 'inline-block',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#f87171',
            border: '1px solid rgba(248,113,113,0.25)',
            background: 'rgba(248,113,113,0.06)',
            padding: '4px 10px',
            borderRadius: '100px',
            marginBottom: '20px',
            fontFamily: "'DM Mono', monospace",
          }}>
            Generic AI (ChatGPT)
          </span>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            color: '#666',
            marginBottom: '18px',
          }}>
            Answers from everywhere
          </div>
          {items.bad.map((text, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '12px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '12px',
              color: '#4a4a4a',
              lineHeight: 1.65,
            }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: 'rgba(248,113,113,0.4)',
                flexShrink: 0, marginTop: '6px',
              }} />
              {text}
            </div>
          ))}
        </div>

        {/* Right — NotesMind */}
        <div style={{
          padding: '32px 28px',
          background: 'rgba(79,70,229,0.04)',
        }}>
          <span style={{
            display: 'inline-block',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#a5b4fc',
            border: '1px solid rgba(79,70,229,0.35)',
            background: 'rgba(79,70,229,0.08)',
            padding: '4px 10px',
            borderRadius: '100px',
            marginBottom: '20px',
            fontFamily: "'DM Mono', monospace",
          }}>
            NotesMind
          </span>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            color: '#f0f0f0',
            marginBottom: '18px',
          }}>
            Answers from your document
          </div>
          {items.good.map((text, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '12px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '12px',
              color: '#aaa',
              lineHeight: 1.65,
            }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#4f46e5',
                flexShrink: 0, marginTop: '6px',
              }} />
              {text}
            </div>
          ))}
        </div>
      </div>
    </FadeUp>
  )
}

// ─── BLOCK 2: Steps ───────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: 'Upload your PDF',
    desc: 'Drop any PDF — lecture notes, research paper, textbook chapter, legal contract. NotesMind extracts, chunks, and indexes it in seconds using hybrid BM25 + FAISS search.',
  },
  {
    num: '02',
    title: 'Ask anything about it',
    desc: 'Type a question in plain English. "What is the risk formula?" "Summarize chapter 3." "What are the key differences between X and Y?" No special syntax. No prompting tricks.',
  },
  {
    num: '03',
    title: 'Get grounded answers',
    desc: 'The AI answers strictly from your document — formatted in clean markdown with headings and bullet points. If the answer isn\'t in your file, it says so. No guessing.',
  },
]

function StepsBlock() {
  return (
    <div style={{ maxWidth: '620px', margin: '0 auto', position: 'relative' }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute',
        left: '22px',
        top: '46px',
        bottom: '46px',
        width: '1px',
        background: 'linear-gradient(to bottom, #4f46e5 0%, #2a2a2a 80%, transparent 100%)',
        zIndex: 0,
      }} />

      {STEPS.map((step, i) => (
        <FadeUp key={i} delay={i * 0.12}>
          <div style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'flex-start',
            marginBottom: i < STEPS.length - 1 ? '36px' : 0,
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Step circle */}
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              border: i === 0 ? 'none' : '1px solid #2a2a2a',
              background: i === 0 ? '#4f46e5' : '#0f0f0f',
              boxShadow: i === 0 ? '0 0 24px rgba(79,70,229,0.45)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Syne', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              color: i === 0 ? '#fff' : '#555',
              flexShrink: 0,
            }}>
              {step.num}
            </div>

            {/* Step content */}
            <div style={{ paddingTop: '10px' }}>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '15px',
                fontWeight: 700,
                color: '#f0f0f0',
                marginBottom: '7px',
                letterSpacing: '-0.01em',
              }}>
                {step.title}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '12px',
                color: '#555',
                lineHeight: 1.8,
              }}>
                {step.desc}
              </div>
            </div>
          </div>
        </FadeUp>
      ))}
    </div>
  )
}

// ─── BLOCK 3: Differentiator cards ───────────────────────────────────────────
const DIFF_CARDS = [
  {
    tag: 'BM25 + FAISS',
    title: 'Hybrid Search',
    desc: 'Combines semantic meaning with exact keyword matching. Finds "Risk = Hazard × Vulnerability" even when meaning-only search would miss the exact formula.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    tag: 'ms-marco reranker',
    title: 'Cross-Encoder Reranking',
    desc: 'After retrieval, a second AI model re-scores each candidate by reading your question and chunk together — sending only the most relevant context to the LLM.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
      </svg>
    ),
  },
  {
    tag: 'Zero hallucination policy',
    title: 'Strict Grounding',
    desc: 'The LLM is instructed to answer only from context. If the answer isn\'t in your PDF, it says "not covered in this document" — it never invents an answer.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
]

function DiffCard({ card, delay }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={{ borderColor: 'rgba(79,70,229,0.5)', backgroundColor: 'rgba(79,70,229,0.04)' }}
      style={{
        background: '#0f0f0f',
        border: '1px solid #222',
        borderRadius: '14px',
        padding: '24px 20px',
        cursor: 'default',
        transition: 'border-color 250ms, background 250ms',
      }}
    >
      <div style={{
        width: '36px', height: '36px',
        background: 'rgba(79,70,229,0.1)',
        border: '1px solid rgba(79,70,229,0.2)',
        borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px',
      }}>
        {card.icon}
      </div>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: '14px', fontWeight: 700,
        color: '#f0f0f0', marginBottom: '8px',
      }}>
        {card.title}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '11px', color: '#555', lineHeight: 1.8,
        marginBottom: '16px',
      }}>
        {card.desc}
      </div>
      <span style={{
        display: 'inline-block',
        fontSize: '9px', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#4f46e5',
        border: '1px solid rgba(79,70,229,0.25)',
        padding: '2px 8px', borderRadius: '100px',
        fontFamily: "'DM Mono', monospace",
      }}>
        {card.tag}
      </span>
    </motion.div>
  )
}

// ─── BLOCK 4: Persona cards ───────────────────────────────────────────────────
const PERSONAS = [
  {
    role: 'Student',
    quote: '"I uploaded my entire semester\'s notes and asked it to quiz me. Every answer was from my actual material."',
    detail: 'Exam prep, concept clarification, chapter summaries — without hallucinated facts contaminating your study session.',
  },
  {
    role: 'Researcher',
    quote: '"I asked it to find every mention of methodology limitations across a 60-page paper. Done in seconds."',
    detail: 'Navigate dense academic PDFs, extract specific findings, and compare sections without losing your place.',
  },
  {
    role: 'Professional',
    quote: '"I dropped in a 40-page policy document and asked plain-English questions. No more CTRL+F guessing."',
    detail: 'Contracts, reports, manuals — ask precise questions and get structured answers without reading every line.',
  },
]

function PersonaCard({ persona, delay }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      style={{
        background: '#0f0f0f',
        border: '1px solid #1a1a1a',
        borderRadius: '14px',
        padding: '24px 20px',
      }}
    >
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '9px', letterSpacing: '0.15em',
        textTransform: 'uppercase', color: '#4f46e5',
        marginBottom: '14px',
      }}>
        {persona.role}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '12px', color: '#bbb',
        lineHeight: 1.75, fontStyle: 'italic',
        borderLeft: '2px solid rgba(79,70,229,0.35)',
        paddingLeft: '12px', marginBottom: '14px',
      }}>
        {persona.quote}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '11px', color: '#444', lineHeight: 1.7,
      }}>
        {persona.detail}
      </div>
    </motion.div>
  )
}

// ─── Builder card ─────────────────────────────────────────────────────────────
function BuilderCard({ photoUrl }) {
  return (
    <FadeUp delay={0.05}>
      <div style={{
        maxWidth: '520px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        <SectionLabel text="The Builder" />
        <div style={{
          width: '100%',
          background: '#0f0f0f',
          border: '1px solid #222',
          borderRadius: '16px',
          padding: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          transition: 'border-color 250ms',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,70,229,0.4)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
        >
          {/* Avatar */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            border: '1px solid rgba(79,70,229,0.3)',
            overflow: 'hidden', flexShrink: 0,
            background: 'rgba(79,70,229,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Rajat Dhiman"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '18px', fontWeight: 800, color: '#a5b4fc',
              }}>
                RD
              </span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '16px', fontWeight: 700,
              color: '#f0f0f0', letterSpacing: '-0.01em',
              marginBottom: '4px',
            }}>
              Rajat Dhiman
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '11px', color: '#555',
              lineHeight: 1.65, marginBottom: '14px',
            }}>
              Built to solve a real problem: AI that actually reads your document instead of making things up.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                {
                  href: 'https://github.com/Rajat-dhiman01',
                  label: '@Rajat-dhiman01',
                  icon: (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.37.6.1.82-.26.82-.57v-2c-3.34.72-4.04-1.6-4.04-1.6-.54-1.38-1.33-1.74-1.33-1.74-1.08-.74.08-.72.08-.72 1.2.08 1.83 1.23 1.83 1.23 1.06 1.82 2.78 1.3 3.46.99.1-.77.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.28-1.23 3.28-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.2.68.82.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  ),
                },
                {
                  href: 'https://twitter.com/Rajat_dhiman01',
                  label: '@Rajat_dhiman01',
                  icon: (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622z"/>
                    </svg>
                  ),
                },
              ].map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '10px', color: '#555',
                    border: '1px solid #2a2a2a', padding: '4px 10px',
                    borderRadius: '100px', textDecoration: 'none',
                    letterSpacing: '0.04em',
                    transition: 'border-color 150ms, color 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.5)'; e.currentTarget.style.color = '#a5b4fc' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}
                >
                  {link.icon}
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FadeUp>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #141414',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      marginTop: '64px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        fontFamily: "'DM Mono', monospace",
      }}>
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700, fontSize: '12px', color: '#444',
        }}>
          Notes<span style={{ color: '#4f46e5' }}>Mind</span>
        </span>
        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#2a2a2a', display: 'inline-block' }} />
        <span style={{ fontSize: '11px', color: '#333' }}>© 2026 Rajat Dhiman</span>
        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#2a2a2a', display: 'inline-block' }} />
        <span style={{ fontSize: '11px', color: '#333' }}>All rights reserved</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {[
          { href: 'https://github.com/Rajat-dhiman01/notesmind', label: 'GitHub' },
          { href: 'https://twitter.com/Rajat_dhiman01', label: 'Twitter' },
        ].map((link, i) => (
          <a
            key={i}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '11px', color: '#333',
              textDecoration: 'none',
              transition: 'color 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
            onMouseLeave={e => e.currentTarget.style.color = '#333'}
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  )
}

// ─── Responsive grid helper ───────────────────────────────────────────────────
function ResponsiveGrid({ children, minWidth = 260 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
      gap: '16px',
      maxWidth: '860px',
      margin: '0 auto',
    }}>
      {children}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function HowItWorksSection({ sectionRef, onTryNow, photoUrl = null }) {
  return (
    <section
      ref={sectionRef}
      style={{
        background: '#080808',
        padding: '96px 24px 0',
        overflowX: 'hidden',
      }}
    >
      {/* ── BLOCK 1: Why NotesMind ── */}
      <div style={{ marginBottom: '96px' }}>
        <SectionHeader
          label="Why NotesMind"
          title="Not all AI is the same"
          sub="Generic AI makes things up. NotesMind only answers from your document."
        />
        <ContrastBlock />
      </div>

      {/* ── BLOCK 2: How it works ── */}
      <div style={{ marginBottom: '96px' }}>
        <SectionHeader
          label="How it works"
          title="Three steps. That's it."
          sub="No setup. No training. No configuration required."
        />
        <StepsBlock />
      </div>

      {/* ── BLOCK 3: Technical differentiators ── */}
      <div style={{ marginBottom: '96px' }}>
        <SectionHeader
          label="Under the hood"
          title="Built for accuracy"
          sub="Three layers of retrieval precision most RAG apps skip."
        />
        <ResponsiveGrid minWidth={240}>
          {DIFF_CARDS.map((card, i) => (
            <DiffCard key={i} card={card} delay={i * 0.1} />
          ))}
        </ResponsiveGrid>
      </div>

      {/* ── BLOCK 4: Who it's for ── */}
      <div style={{ marginBottom: '96px' }}>
        <SectionHeader
          label="Who it's for"
          title="Built for anyone with documents"
          sub="Students, researchers, professionals — anyone who reads PDFs."
        />
        <ResponsiveGrid minWidth={240}>
          {PERSONAS.map((persona, i) => (
            <PersonaCard key={i} persona={persona} delay={i * 0.1} />
          ))}
        </ResponsiveGrid>
      </div>

      {/* ── Bottom CTA ── */}
      <FadeUp>
        <div style={{
          textAlign: 'center',
          padding: '56px 24px',
          borderTop: '1px solid #1a1a1a',
          maxWidth: '860px',
          margin: '0 auto 80px',
        }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(20px, 3vw, 32px)',
            fontWeight: 800,
            color: '#f0f0f0',
            letterSpacing: '-0.02em',
            margin: '0 0 10px',
          }}>
            Your documents. Your answers.
          </h2>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '12px', color: '#555',
            marginBottom: '28px',
          }}>
            No hallucinations. No guessing. Just your PDF, answered precisely.
          </p>
          <button
            onClick={onTryNow}
            style={{
              background: '#4f46e5', color: '#fff',
              border: 'none', padding: '12px 32px',
              borderRadius: '8px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '13px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              transition: 'background 150ms, transform 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4338ca'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Try it now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </FadeUp>

      {/* ── Builder card ── */}
      <div style={{ marginBottom: '0', padding: '0 0 64px' }}>
        <BuilderCard photoUrl={photoUrl} />
      </div>

      {/* ── Footer ── */}
      <Footer />
    </section>
  )
}