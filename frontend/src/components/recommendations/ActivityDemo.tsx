import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  Pause,
  Check,
  Eye,
  Ear,
  Wind,
  UtensilsCrossed,
  Hand,
  NotebookPen,
} from 'lucide-react'
import type { Activity } from '../../lib/types'
import { cn } from '../../lib/cn'

/* ------------------------------------------------------------------ */
/* Shared demo step model                                              */
/* ------------------------------------------------------------------ */

interface DemoStep {
  title: string
  caption: string
}

interface DemoProps {
  activity: Activity
  running: boolean
  step: number
  setStep: (n: number | ((prev: number) => number)) => void
}

const fmtDur = (s: number) => `${s}s`

/* ---------------- Box breathing ---------------- */
const BREATH_PHASES = [
  { label: 'Breathe in', sub: 'through your nose', dur: 4 },
  { label: 'Hold', sub: 'gently', dur: 4 },
  { label: 'Breathe out', sub: 'slowly through your mouth', dur: 4 },
  { label: 'Hold', sub: 'rest', dur: 4 },
]

function BoxBreathingDemo({ running }: DemoProps) {
  const [phase, setPhase] = useState(0)
  const [count, setCount] = useState(BREATH_PHASES[0].dur)
  const phaseRef = useRef(0)

  useEffect(() => {
    if (!running) return
    phaseRef.current = 0
    setPhase(0)
    setCount(BREATH_PHASES[0].dur)
    const tick = setInterval(() => {
      setCount((c) => {
        if (c > 1) return c - 1
        const next = (phaseRef.current + 1) % BREATH_PHASES.length
        phaseRef.current = next
        setPhase(next)
        return BREATH_PHASES[next].dur
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [running])

  const p = BREATH_PHASES[phase]
  const scale = p.label === 'Breathe in' ? 1.35 : p.label === 'Breathe out' ? 1 : 1.18

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative flex h-56 w-56 items-center justify-center">
        {/* square frame */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-teal-700/40"
          animate={{ scale: running ? scale : 1, opacity: running ? 1 : 0.5 }}
          transition={{ duration: p.dur, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-6 rounded-xl border border-teal-700/25"
          animate={{ scale: running ? scale : 1 }}
          transition={{ duration: p.dur, ease: 'easeInOut' }}
        />
        <div className="text-center">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-bold text-ink"
          >
            {p.label}
          </motion.p>
          <p className="mt-0.5 text-xs text-ink/55">{p.sub}</p>
          <p className="mt-2 text-4xl font-bold tabular-nums text-teal-700">
            {running ? count : fmtDur(p.dur)}
          </p>
        </div>
      </div>
      <p className="mt-6 max-w-xs text-center text-sm text-ink/55">
        Follow the square: expand on the inhale, hold, contract on the exhale.
        Four counts each side.
      </p>
    </div>
  )
}

/* ---------------- Stretch demo ---------------- */
const STRETCH_STEPS: DemoStep[] = [
  { title: 'Neck rolls', caption: 'Drop your chin to your chest, roll slowly to one shoulder, across, and to the other. 3 rounds each way.' },
  { title: 'Shoulder stretch', caption: 'Reach one arm across your body, hug it with the other. Hold 20 seconds, switch sides.' },
  { title: 'Forward fold', caption: 'Bend at the hips with soft knees. Let your head and arms hang heavy for 30 seconds.' },
]

function StretchFigure({ step, running }: { step: number; running: boolean }) {
  // simple stick figure with animated arm positions per step
  const arms = [
    { left: 'rotate(-20deg)', right: 'rotate(20deg)' }, // neck rolls — arms relaxed
    { left: 'rotate(-70deg)', right: 'rotate(10deg)' }, // shoulder stretch
    { left: 'rotate(80deg)', right: 'rotate(80deg)' }, // forward fold — arms hang
  ][Math.min(step, 2)]

  return (
    <svg viewBox="0 0 120 160" className="h-52 w-auto">
      {/* head */}
      <motion.circle
        cx="60" cy="22" r="12" fill="none" stroke="#1C2420" strokeWidth="2.5"
        animate={running ? { y: step === 2 ? 26 : 0 } : {}}
        transition={{ duration: 1.2, repeat: running ? Infinity : 0, repeatType: 'reverse', ease: 'easeInOut' }}
      />
      {/* body */}
      <line x1="60" y1="34" x2="60" y2="95" stroke="#1C2420" strokeWidth="2.5" strokeLinecap="round" />
      {/* arms */}
      <motion.line
        x1="60" y1="45" x2="38" y2="70" stroke="#0E7C66" strokeWidth="2.5" strokeLinecap="round"
        style={{ transformOrigin: '60px 45px' }}
        animate={{ rotate: running ? arms.left : '0deg' }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      />
      <motion.line
        x1="60" y1="45" x2="82" y2="70" stroke="#0E7C66" strokeWidth="2.5" strokeLinecap="round"
        style={{ transformOrigin: '60px 45px' }}
        animate={{ rotate: running ? arms.right : '0deg' }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      />
      {/* legs */}
      <line x1="60" y1="95" x2="45" y2="140" stroke="#1C2420" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="95" x2="75" y2="140" stroke="#1C2420" strokeWidth="2.5" strokeLinecap="round" />
      {/* ground */}
      <line x1="25" y1="142" x2="95" y2="142" stroke="#E5E2DC" strokeWidth="2" />
    </svg>
  )
}

function StretchDemo({ running, step }: DemoProps) {
  return (
    <div className="flex flex-col items-center py-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35 }}
          className="flex w-full flex-col items-center"
        >
          <StretchFigure step={step} running={running} />
          <h4 className="mt-4 text-lg font-bold tracking-tight">{STRETCH_STEPS[step].title}</h4>
          <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-ink/60">
            {STRETCH_STEPS[step].caption}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ---------------- Senses sequence ---------------- */
const SENSES = [
  { icon: Eye, name: 'Sight', prompt: 'Name 5 things you can see right now. Look for colors and textures you usually miss.' },
  { icon: Ear, name: 'Sound', prompt: 'Notice 4 sounds around you — near and far. Let them come to you without chasing.' },
  { icon: Wind, name: 'Smell', prompt: 'Find 3 scents. Coffee, rain, paper, soap — whatever is actually there.' },
  { icon: UtensilsCrossed, name: 'Taste', prompt: 'Notice the taste in your mouth. Take a sip of water and feel it fully.' },
  { icon: Hand, name: 'Touch', prompt: 'Feel your feet on the floor, the air on your skin, the texture of what you hold.' },
]

function SensesDemo({ running, step }: DemoProps) {
  return (
    <div className="py-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-md rounded-2xl border border-hairline bg-sage/40 p-8 text-center"
        >
          {(() => {
            const S = SENSES[step]
            const Icon = S.icon
            return (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white">
                  <Icon size={24} strokeWidth={1.7} />
                </span>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                  Sense {step + 1} of 5
                </p>
                <h4 className="mt-1 text-2xl font-bold tracking-tight">{S.name}</h4>
                <p className="mt-3 text-sm leading-relaxed text-ink/65">{S.prompt}</p>
                <p className="mt-4 text-xs text-ink/45">
                  Spend about 30 seconds here before moving on{running ? '' : ' (press play to guide timing)'}.
                </p>
              </>
            )
          })()}
        </motion.div>
      </AnimatePresence>
      <div className="mt-5 flex justify-center gap-1.5">
        {SENSES.map((_, i) => (
          <span key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-teal-700' : 'w-1.5 bg-hairline')} />
        ))}
      </div>
    </div>
  )
}

/* ---------------- Walking animation ---------------- */
function WalkingFigure({ running }: { running: boolean }) {
  return (
    <svg viewBox="0 0 160 120" className="h-44 w-auto">
      {/* head + torso */}
      <circle cx="80" cy="18" r="10" fill="none" stroke="#1C2420" strokeWidth="2.5" />
      <line x1="80" y1="28" x2="78" y2="62" stroke="#1C2420" strokeWidth="2.5" strokeLinecap="round" />
      {/* arms swing */}
      <motion.line
        x1="78" y1="34" x2="62" y2="52" stroke="#0E7C66" strokeWidth="2.5" strokeLinecap="round"
        animate={running ? { rotate: [18, -18, 18] } : {}}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '78px 34px' }}
      />
      <motion.line
        x1="78" y1="34" x2="94" y2="52" stroke="#0E7C66" strokeWidth="2.5" strokeLinecap="round"
        animate={running ? { rotate: [-18, 18, -18] } : {}}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '78px 34px' }}
      />
      {/* legs alternate */}
      <motion.line
        x1="78" y1="62" x2="60" y2="100" stroke="#1C2420" strokeWidth="2.5" strokeLinecap="round"
        animate={running ? { rotate: [14, -14, 14] } : {}}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '78px 62px' }}
      />
      <motion.line
        x1="78" y1="62" x2="96" y2="100" stroke="#1C2420" strokeWidth="2.5" strokeLinecap="round"
        animate={running ? { rotate: [-14, 14, -14] } : {}}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '78px 62px' }}
      />
      {/* ground + moving dashes */}
      <line x1="20" y1="102" x2="140" y2="102" stroke="#E5E2DC" strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <motion.line
          key={i}
          x1="30" y1="112" x2="46" y2="112" stroke="#0E7C66" strokeWidth="2" strokeLinecap="round"
          animate={running ? { x: [0, -120] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5, ease: 'linear' }}
        />
      ))}
    </svg>
  )
}

function WalkingDemo({ running }: DemoProps) {
  const [steps, setSteps] = useState(0)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSteps((s) => s + 1), 900)
    return () => clearInterval(t)
  }, [running])
  return (
    <div className="flex flex-col items-center py-4">
      <WalkingFigure running={running} />
      <p className="mt-5 text-3xl font-bold tabular-nums text-teal-700">{steps}</p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">
        steps walked (simulated)
      </p>
      <p className="mt-4 max-w-xs text-center text-sm text-ink/55">
        Walk at a pace where you could talk but not sing. Notice your feet, the
        rhythm of your breath, the view around you.
      </p>
    </div>
  )
}

/* ---------------- Journaling demo ---------------- */
const JOURNAL_PROMPTS = [
  'What is one thing that went better than expected today?',
  'Name a feeling you had today and where you felt it in your body.',
  'What is one tiny thing you could do tomorrow to feel 5% better?',
]

function JournalingDemo({ running, step }: DemoProps) {
  const [typed, setTyped] = useState(0)

  useEffect(() => {
    if (!running) {
      setTyped(0)
      return
    }
    const prompt = JOURNAL_PROMPTS[step]
    if (typed >= prompt.length) return
    const t = setTimeout(() => setTyped((v) => v + 2), 24)
    return () => clearTimeout(t)
  }, [running, typed, step])

  const prompt = JOURNAL_PROMPTS[step]

  return (
    <div className="mx-auto max-w-md py-4">
      <div className="rounded-xl border border-hairline bg-surface p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2 border-b border-hairline pb-3">
          <NotebookPen size={16} className="text-teal-700" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
            Journal · Prompt {step + 1} of {JOURNAL_PROMPTS.length}
          </span>
        </div>
        <p className="min-h-20 font-serif text-[15px] leading-relaxed text-ink/80">
          {prompt.slice(0, typed)}
          {running && typed < prompt.length && (
            <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-teal-700 align-middle" />
          )}
        </p>
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-px w-full bg-hairline" />
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-ink/55">
        Write freely in your own notebook — there are no wrong answers.
      </p>
    </div>
  )
}

/* ---------------- Generic steps ---------------- */
function GenericStepsDemo({ activity, step }: DemoProps) {
  const steps = activity.instructions?.length
    ? activity.instructions
    : activity.benefits?.map((b, i) => ({ step: i + 1, text: b })) ?? []

  if (steps.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-ink/55">
        No step-by-step instructions are available for this activity yet.
      </div>
    )
  }

  const current = steps[Math.min(step, steps.length - 1)]
  return (
    <div className="py-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-md rounded-2xl border border-hairline bg-sage/40 p-8 text-center"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-2xl font-bold text-paper">
            {current.step}
          </span>
          <h4 className="mt-4 text-lg font-bold tracking-tight">Step {current.step}</h4>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">{current.text}</p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-2 flex justify-center gap-1.5">
        {steps.map((_, i) => (
          <span key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-teal-700' : 'w-1.5 bg-hairline')} />
        ))}
      </div>
      {step < steps.length - 1 && (
        <p className="mt-4 text-center text-xs text-ink/45">Use Next to continue to the following step.</p>
      )}
    </div>
  )
}

/* ---------------- Modal shell ---------------- */

const DEMO_META: Record<string, { title: string; steps: number }> = {
  box_breathing: { title: 'Box Breathing', steps: 1 },
  stretch_demo: { title: 'Guided Stretch', steps: STRETCH_STEPS.length },
  senses_sequence: { title: '5-4-3-2-1 Senses', steps: SENSES.length },
  walking_animation: { title: 'Mindful Walking', steps: 1 },
  journaling_demo: { title: 'Guided Journaling', steps: JOURNAL_PROMPTS.length },
}

export function ActivityDemo({
  activity,
  open,
  onClose,
  onComplete,
}: {
  activity: Activity | null
  open: boolean
  onClose: () => void
  onComplete?: () => void
}) {
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const kind = activity?.demonstration_type ?? 'generic_steps'
  const meta = DEMO_META[kind] ?? { title: 'Activity Demo', steps: activity?.instructions?.length || 1 }
  const totalSteps =
    kind === 'generic_steps'
      ? Math.max(activity?.instructions?.length ?? 0, activity?.benefits?.length ?? 1, 1)
      : meta.steps

  // reset when activity changes
  useEffect(() => {
    setRunning(false)
    setStep(0)
  }, [activity?.activity_id])

  // keyboard: esc closes
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  const demoProps: DemoProps = {
    activity: activity as Activity,
    running,
    step,
    setStep: (n) => setStep((s) => (typeof n === 'function' ? n(s) : n)),
  }

  const renderDemo = () => {
    if (!activity) return null
    switch (kind) {
      case 'box_breathing':
        return <BoxBreathingDemo {...demoProps} />
      case 'stretch_demo':
        return <StretchDemo {...demoProps} />
      case 'senses_sequence':
        return <SensesDemo {...demoProps} />
      case 'walking_animation':
        return <WalkingDemo {...demoProps} />
      case 'journaling_demo':
        return <JournalingDemo {...demoProps} />
      case 'generic_steps':
      default:
        return <GenericStepsDemo {...demoProps} />
    }
  }

  const handleNext = () => {
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }

  if (!activity) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-hairline bg-paper shadow-card"
          >
            {/* header */}
            <div className="flex items-start justify-between gap-4 border-b border-hairline bg-surface px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                  Guided Demonstration
                </p>
                <h3 className="mt-1 text-lg font-bold tracking-tight">
                  {meta.title} — {activity.activity_title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-ink/50 transition-colors hover:bg-sage/50 hover:text-ink"
                aria-label="Exit demo"
              >
                <X size={18} />
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-6">{renderDemo()}</div>

            {/* footer controls */}
            <div className="border-t border-hairline bg-surface px-6 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">
                  Step {Math.min(step + 1, totalSteps)} of {totalSteps}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === step ? 'w-6 bg-teal-700' : 'w-3 bg-hairline',
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  {totalSteps > 1 && (
                    <button
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                      disabled={step === 0}
                      className="flex items-center gap-1.5 rounded-lg border border-hairline px-3.5 py-2 text-xs font-semibold text-ink/70 transition-colors hover:border-teal-700/40 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setStep(0)
                      setRunning(false)
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-hairline px-3.5 py-2 text-xs font-semibold text-ink/70 transition-colors hover:border-teal-700/40"
                  >
                    <RotateCcw size={14} /> Replay
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRunning((r) => !r)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors',
                      running
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-teal-700 text-white hover:bg-teal-800',
                    )}
                  >
                    {running ? <Pause size={13} /> : <Play size={13} />}
                    {running ? 'Pause' : 'Start'}
                  </button>
                  {totalSteps > 1 && step < totalSteps - 1 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper transition-colors hover:bg-teal-800"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onComplete?.()
                        onClose()
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper transition-colors hover:bg-teal-800"
                    >
                      <Check size={13} /> Complete
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="rounded-lg border border-hairline px-3.5 py-2 text-xs font-semibold text-ink/60 transition-colors hover:text-ink"
                  >
                    Exit
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
