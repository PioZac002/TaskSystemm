import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { PixelMark, Wordmark } from "@/components/arcade/PixelMark";
import { StatusGlyph } from "@/components/arcade/StatusGlyph";
import {
    IconArrowRight,
    IconBoard,
    IconComment,
    IconGamepad,
    IconGithub,
    IconReload,
    IconSkull,
    IconSpawn,
    IconTv,
    IconUser,
} from "@/components/arcade/icons";
import { STATUS_LABELS } from "@/utils/issueConstants";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";
import dashboardDark from "@/assets/dashboard-screen-dark.jpg";
import dashboardLight from "@/assets/dashboard-screen-light.jpg";
import "./landing.css";

const REPO_URL = "https://github.com/PioZac002/TaskSystemFront";

// The demo run: TS-12 through the real workflow. Positions are cells on a 4 x 2 stage map.
const STAGES = [
    { status: "NEW", col: 0, row: 0, log: "Mon 09:12 · Ola filed TS-12 in project TS" },
    { status: "TRIAGE", col: 1, row: 0, log: "Mon 09:40 · Ola raised priority to High" },
    { status: "TODO", col: 2, row: 0, log: "Mon 10:05 · Kuba assigned, notification sent" },
    { status: "IN_PROGRESS", col: 3, row: 0, log: "Mon 13:30 · Kuba started work" },
    { status: "WAITING_FOR_TEAM", col: 3, row: 1, log: "Tue 11:02 · Handed to Backend, @Marta pinged" },
    { status: "CODE_REVIEW", col: 2, row: 1, log: "Wed 16:48 · Marta opened the review" },
    { status: "DONE", col: 1, row: 1, log: "Thu 09:15 · Kuba merged and closed TS-12" },
];
const PIT = { status: "CANCELED", col: 0, row: 1, log: "TS-12 canceled. Run over." };

const MOVES = [
    { icon: IconSpawn, move: "File", text: "Open an issue under a project key. It spawns as TS-1, TS-2 and keeps that number for life." },
    { icon: IconUser, move: "Assign", text: "Hand it to a player and a team. The assignee gets a notification." },
    { icon: IconBoard, move: "Move", text: "Push it across the board by drag and drop, through eight states from New to Done." },
    { icon: IconComment, move: "Log", text: "Comment with @mentions and pasted images. The activity log records every change." },
];

const BOARD_ISSUES = [
    { key: "TS-9", title: "Empty state for labels", status: "NEW" },
    { key: "TS-11", title: "Board flickers on move", status: "TRIAGE" },
    { key: "TS-7", title: "Token expires mid-drag", status: "TODO" },
    { key: "TS-10", title: "Assignee filter", status: "IN_PROGRESS" },
    { key: "TS-12", title: "Slack ID lost on save", status: "WAITING_FOR_TEAM" },
    { key: "TS-13", title: "Tag a user in a comment", status: "CODE_REVIEW" },
    { key: "TS-8", title: "PWA icon set", status: "DONE" },
    { key: "TS-5", title: "Weekly email digest", status: "CANCELED" },
];

const BASIC_COLUMNS = [
    { id: "todo", title: "To Do", statuses: ["NEW", "TRIAGE", "TODO"], lead: "TODO" },
    { id: "progress", title: "In Progress", statuses: ["IN_PROGRESS", "WAITING_FOR_TEAM", "CODE_REVIEW"], lead: "IN_PROGRESS" },
    { id: "done", title: "Done", statuses: ["DONE", "CANCELED"], lead: "DONE" },
];
// Short lane names, as the real board's Detailed mode shows them
const LANE_TITLES = { WAITING_FOR_TEAM: "Waiting", CODE_REVIEW: "Review" };
const DETAILED_COLUMNS = ["NEW", "TRIAGE", "TODO", "IN_PROGRESS", "WAITING_FOR_TEAM", "CODE_REVIEW", "DONE", "CANCELED"].map((status) => ({
    id: status,
    title: LANE_TITLES[status] || STATUS_LABELS[status],
    statuses: [status],
    lead: status,
}));

const SCREENS = [
    { id: "dark", label: "Screen", src: dashboardDark, alt: "TaskSystem dashboard in dark mode: open, due and overdue counts, your issues, all stages and your projects", width: 1456, height: 834 },
    { id: "light", label: "Printed card", src: dashboardLight, alt: "The same TaskSystem dashboard in light mode", width: 1456, height: 834 },
];

function readCrt() {
    try {
        return localStorage.getItem("crt") !== "off";
    } catch {
        return true;
    }
}

// TS-12 as a sprite: a ticket stub with two punched eyes, 12 x 10 pixels
const SPRITE_ROWS = [
    "..########..",
    ".##########.",
    "############",
    "###..##..###",
    "###..##..###",
    "############",
    "############",
    "#.##.##.##.#",
    "#..#..#..#.#",
    "..........#.",
];

function TicketSprite({ className }) {
    const pixels = [];
    SPRITE_ROWS.forEach((row, y) => {
        [...row].forEach((cell, x) => {
            if (cell === "#") pixels.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
        });
    });
    return (
        <svg viewBox="0 0 12 10" shapeRendering="crispEdges" aria-hidden="true" className={className} fill="currentColor">
            {pixels}
        </svg>
    );
}

function Playfield({ crt, onStageChange }) {
    const [stage, setStage] = useState(0);
    const [canceled, setCanceled] = useState(false);
    const [flashKey, setFlashKey] = useState(0);
    const cleared = !canceled && stage === STAGES.length - 1;
    const current = canceled ? PIT : STAGES[stage];

    useEffect(() => {
        onStageChange?.({ stage, canceled, status: current.status });
    }, [stage, canceled, current.status, onStageChange]);

    const advance = useCallback(() => {
        if (canceled || cleared) return;
        const next = stage + 1;
        setStage(next);
        if (next === STAGES.length - 1) setFlashKey((k) => k + 1);
    }, [canceled, cleared, stage]);

    const reset = () => {
        setStage(0);
        setCanceled(false);
    };

    const abandon = () => {
        if (!canceled && !cleared) setCanceled(true);
    };

    const handleKeyDown = (event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === " " || event.key === "ArrowRight") {
            event.preventDefault();
            if (canceled || cleared) reset();
            else advance();
        }
    };

    const log = (canceled ? [...STAGES.slice(0, stage + 1), PIT] : STAGES.slice(0, stage + 1)).slice(-3);

    return (
        <div
            className={cn("lp-playfield px-chamfer-lg relative border-2 border-border bg-card", cleared && "is-cleared", canceled && "is-over")}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label="Demo run of issue TS-12. Press Space to move it to the next stage."
        >
            <div className="flex items-center justify-between gap-3 border-b-2 border-border px-4 py-2.5">
                <span className="hud text-[0.6875rem] text-muted-foreground">Demo run · sample data</span>
                <span className="hud text-[0.6875rem]">
                    TS-12 · <span className="text-[var(--px-red)]">High</span>
                </span>
            </div>

            <div className={cn("relative px-tiles", crt && "px-scanlines")}>
                <div className="lp-map relative grid aspect-[4/3] grid-cols-4 grid-rows-2 sm:aspect-[2/1]">
                    {[...STAGES, PIT].map((tile, index) => {
                        const isPit = tile === PIT;
                        const isHere = tile.status === current.status;
                        const visited = !isPit && (canceled ? index <= stage : index < stage);
                        return (
                            <div
                                key={tile.status}
                                className={cn("p-1.5 sm:p-2", `st-${tile.status}`)}
                                style={{ gridColumn: tile.col + 1, gridRow: tile.row + 1 }}
                            >
                                <div
                                    className={cn(
                                        "lp-tile px-chamfer relative flex h-full flex-col justify-between border-2 p-2 sm:p-2.5",
                                        isHere ? "is-here" : visited ? "is-visited" : "",
                                        isPit && "is-pit"
                                    )}
                                >
                                    <span className="hud flex items-center justify-between text-[0.625rem] text-muted-foreground">
                                        <span className="hidden sm:inline">{isPit ? "Game over" : `Stage ${index + 1}`}</span>
                                        <StatusGlyph status={tile.status} size={16} />
                                    </span>
                                    <span className="font-pixel text-[0.75rem] font-bold leading-tight sm:text-base">
                                        {STATUS_LABELS[tile.status]}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* The sprite travels between cells in whole-pixel steps */}
                    <div
                        className="lp-sprite pointer-events-none absolute left-0 top-0 grid h-1/2 w-1/4 place-items-center"
                        style={{ transform: `translate(${current.col * 100}%, ${current.row * 100}%)` }}
                        aria-hidden="true"
                    >
                        <TicketSprite className={cn("lp-sprite-art st-ink h-9 w-11 sm:h-11 sm:w-14", `st-${current.status}`)} />
                    </div>
                </div>

                {cleared && <div key={flashKey} className="px-flash pointer-events-none absolute inset-0" aria-hidden="true" />}
                {cleared && (
                    <p className="lp-banner hud absolute inset-x-0 top-1/2 mx-auto w-max -translate-y-1/2 border-2 border-[var(--px-gold)] bg-background px-4 py-2 text-sm text-[var(--px-gold)]" role="status">
                        Stage clear · TS-12 done
                    </p>
                )}
                {canceled && (
                    <p className="lp-banner hud absolute inset-x-0 top-1/2 mx-auto flex w-max -translate-y-1/2 items-center gap-2 border-2 border-[var(--px-red)] bg-background px-4 py-2 text-sm text-[var(--px-red)]" role="status">
                        <IconSkull width={16} height={16} aria-hidden="true" /> Game over · canceled
                    </p>
                )}
            </div>

            <ol className="min-h-[5.25rem] space-y-1 border-t-2 border-border px-4 py-3 text-[0.8125rem]" aria-live="polite">
                {log.map((entry, i) => (
                    <li key={entry.log} className={cn("flex items-center gap-2", i < log.length - 1 && "text-muted-foreground")}>
                        <StatusGlyph status={entry.status} size={14} />
                        {entry.log}
                    </li>
                ))}
            </ol>

            <div className="flex flex-wrap items-center gap-2 border-t-2 border-border px-4 py-3">
                {canceled || cleared ? (
                    <button type="button" onClick={reset} className="lp-btn lp-btn-primary">
                        <IconReload width={16} height={16} aria-hidden="true" /> Play again
                    </button>
                ) : (
                    <button type="button" onClick={advance} className="lp-btn lp-btn-primary">
                        Next stage <kbd className="lp-kbd">Space</kbd>
                    </button>
                )}
                {!canceled && !cleared && (
                    <button type="button" onClick={abandon} className="lp-btn lp-btn-ghost">
                        Cancel issue
                    </button>
                )}
                <span className="hud ml-auto text-[0.6875rem] text-muted-foreground">
                    {canceled ? "Canceled" : `Stage ${stage + 1} / ${STAGES.length}`}
                </span>
            </div>
        </div>
    );
}

function ModeSelect() {
    const [mode, setMode] = useState("basic");
    const columns = mode === "basic" ? BASIC_COLUMNS : DETAILED_COLUMNS;

    return (
        <div>
            <div role="radiogroup" aria-label="Board mode" className="grid gap-3 sm:grid-cols-2">
                {[
                    { id: "basic", player: "1P", title: "Basic", text: "Three columns for standup. New, Triage and To Do share a lane." },
                    { id: "detailed", player: "2P", title: "Detailed", text: "Eight lanes. Waiting and Review stop hiding inside In Progress." },
                ].map((option) => {
                    const active = mode === option.id;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setMode(option.id)}
                            className={cn("lp-select px-chamfer grid grid-cols-[2.5rem_1fr] gap-x-3 border-2 p-4 text-left", active && "is-active")}
                        >
                            <span className="lp-cursor hud row-span-2 self-center text-base" aria-hidden="true">
                                {option.player}
                            </span>
                            <span className="font-pixel text-2xl font-bold leading-none">{option.title}</span>
                            <span className="mt-1.5 text-sm text-muted-foreground">{option.text}</span>
                        </button>
                    );
                })}
            </div>

            <div className="lp-board-scroll mt-4 overflow-x-auto pb-2">
                <div
                    className={cn("grid gap-2", mode === "basic" ? "min-w-[640px] grid-cols-3" : "min-w-[1040px] grid-cols-8")}
                    aria-label={`${mode === "basic" ? "Basic" : "Detailed"} board preview`}
                >
                    {columns.map((column) => {
                        const issues = BOARD_ISSUES.filter((issue) => column.statuses.includes(issue.status));
                        return (
                            <div key={column.id} className={cn("lp-col border-2 bg-card p-2", `st-${column.lead}`)}>
                                <div className="hud mb-2 flex items-center justify-between gap-2 border-b-2 border-border pb-2 text-[0.6875rem]">
                                    <span className="flex min-w-0 items-center gap-1.5">
                                        <StatusGlyph status={column.lead} size={14} />
                                        <span className="truncate">{column.title}</span>
                                    </span>
                                    <span className="text-muted-foreground">{issues.length}</span>
                                </div>
                                <ul className="space-y-1.5">
                                    {issues.map((issue) => (
                                        <li key={issue.key} className={cn("lp-card border-2 px-2 py-1.5", `st-${issue.status}`, issue.key === "TS-12" && mode === "detailed" && "is-spot")}>
                                            <span className="hud flex items-center gap-1 text-[0.625rem] text-muted-foreground">
                                                <StatusGlyph status={issue.status} size={12} />
                                                {issue.key}
                                            </span>
                                            <span className="mt-0.5 block text-[0.8125rem] leading-snug">{issue.title}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function ScreenBezel({ crt }) {
    const [screenId, setScreenId] = useState(SCREENS[0].id);
    const screen = SCREENS.find((s) => s.id === screenId);

    return (
        <div className="lp-bezel px-chamfer-lg border-2 border-border bg-card p-2 sm:p-3">
            <div role="tablist" aria-label="Dashboard themes" className="mb-2 flex flex-wrap gap-2 sm:mb-3">
                {SCREENS.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        role="tab"
                        aria-selected={s.id === screenId}
                        onClick={() => setScreenId(s.id)}
                        className={cn("lp-btn", s.id === screenId ? "lp-btn-primary" : "lp-btn-ghost")}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
            <div className={cn("relative overflow-hidden border-2 border-border bg-black", crt && "px-scanlines")} role="tabpanel">
                <img src={screen.src} alt={screen.alt} width={screen.width} height={screen.height} loading="lazy" className="block h-auto w-full" />
            </div>
        </div>
    );
}

export default function LandingPage() {
    const [crt, setCrt] = useState(readCrt);
    const [run, setRun] = useState({ stage: 0, canceled: false, status: "NEW" });
    const [demo, setDemo] = useState({ available: false, email: null });
    const [demoLoading, setDemoLoading] = useState(false);
    const { loginDemo } = useAuth();
    const navigate = useNavigate();

    // Only instances that actually seeded a demo account get the coin slot
    useEffect(() => {
        let active = true;
        authService.getDemoStatus().then((status) => {
            if (active) setDemo(status);
        });
        return () => {
            active = false;
        };
    }, []);

    const startDemo = async () => {
        setDemoLoading(true);
        try {
            await loginDemo(true);
            toast.success("You are in the demo workspace");
            navigate("/dashboard");
        } catch (error) {
            const message = error.response?.data?.Message || error.message || "Demo sign-in failed";
            toast.error(message);
            setDemoLoading(false);
        }
    };

    const toggleCrt = () => {
        setCrt((on) => {
            const next = !on;
            try {
                localStorage.setItem("crt", next ? "on" : "off");
            } catch {
                // Storage unavailable: applies for this visit only
            }
            return next;
        });
    };

    return (
        <div className="lp min-h-dvh bg-background text-foreground">
            <a href="#main" className="hud sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
                Skip to content
            </a>

            <header className="sticky top-0 z-50 border-b-2 border-border bg-background">
                <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6">
                    <Link to="/" aria-label="TaskSystem home" className="shrink-0">
                        <Wordmark size={26} />
                    </Link>

                    <p className="hud hidden flex-1 items-center justify-center gap-5 text-[0.6875rem] text-muted-foreground lg:flex" aria-hidden="true">
                        <span>1UP</span>
                        <span className={cn("flex items-center gap-1.5", `st-${run.status}`)}>
                            TS-12 <StatusGlyph status={run.status} size={12} />
                            <span className="st-ink">{STATUS_LABELS[run.status]}</span>
                        </span>
                        <span>{run.canceled ? "Game over" : `Stage ${run.stage + 1}/${STAGES.length}`}</span>
                    </p>

                    <nav aria-label="Main" className="ml-auto flex items-center gap-2 lg:ml-0">
                        <a href="#how" className="lp-navlink hud hidden text-xs md:inline-flex">How to play</a>
                        <a href="#modes" className="lp-navlink hud hidden text-xs md:inline-flex">Modes</a>
                        <button
                            type="button"
                            onClick={toggleCrt}
                            aria-pressed={crt}
                            className="lp-btn lp-btn-ghost hidden sm:inline-flex"
                            title="Scanlines on the demo and screens"
                        >
                            <IconTv width={16} height={16} aria-hidden="true" /> CRT
                        </button>
                        <ThemeToggle />
                        <Link to="/login" className="lp-btn lp-btn-ghost hidden sm:inline-flex">Sign in</Link>
                        <Link to="/register" className="lp-btn lp-btn-primary">Start</Link>
                    </nav>
                </div>
            </header>

            <main id="main">
                {/* Attract screen */}
                <section className="border-b-2 border-border">
                    <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-14 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:py-16">
                        <div className="min-w-0">
                            <h1 className="lp-title px-display px-bloom">
                                Ship every <span className="lp-title-accent">issue.</span>
                            </h1>
                            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
                                A self-hosted issue tracker with eight states from New to Done, where Waiting and Review stay in plain sight.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg">
                                    Press start <IconArrowRight width={18} height={18} aria-hidden="true" />
                                </Link>
                                {demo.available && (
                                    <button
                                        type="button"
                                        onClick={startDemo}
                                        disabled={demoLoading}
                                        className="lp-btn lp-btn-ghost lp-btn-lg"
                                    >
                                        <IconGamepad width={18} height={18} aria-hidden="true" />
                                        {demoLoading ? "Loading demo..." : "Insert coin: demo"}
                                    </button>
                                )}
                                <a href={REPO_URL} target="_blank" rel="noreferrer" className="lp-btn lp-btn-ghost lp-btn-lg">
                                    <IconGithub width={18} height={18} aria-hidden="true" /> Player 2: self-host
                                </a>
                            </div>
                            <p className="mt-5 text-sm text-muted-foreground">
                                {demo.available ? (
                                    <>No account needed for the demo. Already on a team? </>
                                ) : (
                                    <>Already on a team? </>
                                )}
                                <Link to="/login" className="lp-textlink">Sign in</Link>
                            </p>
                        </div>

                        <Playfield crt={crt} onStageChange={setRun} />
                    </div>
                </section>

                {/* Instruction card */}
                <section id="how" className="lp-card-section border-b-2 border-border">
                    <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14 lg:py-28">
                        <div>
                            <h2 className="text-3xl leading-tight sm:text-4xl">How to play</h2>
                            <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
                                Four moves run the whole game. Everything else is keyboard, board and a history you can trust.
                            </p>
                        </div>
                        <dl className="lp-moves border-2 border-border bg-card">
                            {MOVES.map(({ icon, move, text }) => {
                                const MoveIcon = icon;
                                return (
                                <div key={move} className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1 border-b-2 border-border p-4 last:border-b-0 sm:grid-cols-[3rem_8rem_minmax(0,1fr)] sm:items-center sm:p-5">
                                    <span className="lp-move-icon grid h-12 w-12 place-items-center border-2 border-border bg-background">
                                        <MoveIcon width={24} height={24} aria-hidden="true" />
                                    </span>
                                    <dt className="font-pixel text-2xl font-bold leading-none">{move}</dt>
                                    <dd className="col-start-2 text-base leading-relaxed text-muted-foreground sm:col-start-3">{text}</dd>
                                </div>
                                );
                            })}
                        </dl>
                    </div>
                </section>

                {/* Mode select */}
                <section id="modes" className="border-b-2 border-border">
                    <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 lg:py-28">
                        <div className="mb-8 max-w-2xl">
                            <h2 className="text-3xl leading-tight sm:text-4xl">Select your board</h2>
                            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                                Same issues, two levels of detail. Switch whenever standup turns into a hunt for what is blocked.
                            </p>
                        </div>
                        <ModeSelect />
                    </div>
                </section>

                {/* Real screens */}
                <section id="screens" className="border-b-2 border-border">
                    <div className="mx-auto grid max-w-[1280px] items-start gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] lg:gap-14 lg:py-28">
                        <div>
                            <h2 className="text-3xl leading-tight sm:text-4xl">On screen now</h2>
                            <p className="mt-4 max-w-xs text-base leading-relaxed text-muted-foreground">
                                The dashboard from a local instance with sample projects, on the dark screen and the printed card.
                            </p>
                        </div>
                        <ScreenBezel crt={crt} />
                    </div>
                </section>

                {/* Insert coin */}
                <section className="lp-close">
                    <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-8 px-4 py-24 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-32">
                        <div>
                            <h2 className="lp-close-title px-display px-bloom">
                                Press start<span className="lp-caret" aria-hidden="true" />
                            </h2>
                            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                                Create an account on the demo, or take the source and run TaskSystem on your own infrastructure.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg">Create account</Link>
                            {demo.available && (
                                <button
                                    type="button"
                                    onClick={startDemo}
                                    disabled={demoLoading}
                                    className="lp-btn lp-btn-ghost lp-btn-lg"
                                >
                                    <IconGamepad width={18} height={18} aria-hidden="true" />
                                    {demoLoading ? "Loading demo..." : "Insert coin: demo"}
                                </button>
                            )}
                            <Link to="/login" className="lp-btn lp-btn-ghost lp-btn-lg">Sign in</Link>
                            <a href={REPO_URL} target="_blank" rel="noreferrer" className="lp-btn lp-btn-ghost lp-btn-lg">
                                <IconGithub width={18} height={18} aria-hidden="true" /> Source
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t-2 border-border">
                <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <span className="flex items-center gap-2">
                        <PixelMark size={18} />
                        <span className="hud text-[0.6875rem] text-muted-foreground">© {new Date().getFullYear()} TaskSystem</span>
                    </span>
                    <span className="hud text-[0.6875rem] text-muted-foreground">React 19 · Spring Boot · self-hosted</span>
                    <a href={REPO_URL} target="_blank" rel="noreferrer" className="lp-navlink hud inline-flex items-center gap-1.5 text-[0.6875rem]">
                        <IconGithub width={14} height={14} aria-hidden="true" /> GitHub
                    </a>
                </div>
            </footer>
        </div>
    );
}
