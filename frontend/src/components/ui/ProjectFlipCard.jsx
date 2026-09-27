import React, { useState } from "react";
import { Link } from "react-router-dom";
import { IssueLabelChips } from "@/components/ui/IssueLabelChips";
import { PxMeter, StatusGlyph } from "@/components/arcade/StatusGlyph";
import { IconArrowRight, IconEye, IconFolder, IconReload } from "@/components/arcade/icons";
import { STATUS_LABELS } from "@/utils/issueConstants";
import { cn } from "@/lib/utils";

// A project as a level card: stats on the front, the issue roster on the back.
export function ProjectFlipCard({ project, issues = [], className, onPreview, onIssuePreview }) {
    const [flipped, setFlipped] = useState(false);
    const visibleIssues = issues.slice(0, 5);
    const projectName = project.name || project.shortName || `Project #${project.id}`;
    const projectDescription = project.description || "No description provided";
    const issueCount = project.issueCount ?? project.totalIssues ?? issues.length;
    const cleared = (project.progress || 0) === 100 && issueCount > 0;

    const handleToggle = (event) => {
        if (event.target.closest("a, button")) return;
        setFlipped((value) => !value);
    };

    return (
        <article
            className={cn("project-flip-card group", flipped && "is-flipped", className)}
            tabIndex={0}
            onClick={handleToggle}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setFlipped((value) => !value);
                }
            }}
            aria-label={`${projectName} project card. Press Enter to ${flipped ? "show stats" : "show issues"}.`}
        >
            <div className="project-flip-card__inner">
                <div className="project-flip-card__face project-flip-card__front border-2 border-border bg-card text-card-foreground" aria-hidden={flipped}>
                    <div className="flex h-full flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className={cn("grid h-10 w-10 shrink-0 place-items-center border-2", cleared ? "border-[var(--px-gold)] text-[var(--px-gold)]" : "border-border text-primary dark:text-[var(--px-cyan)]")}>
                                <IconFolder width={20} height={20} aria-hidden="true" />
                            </span>
                            <div className="flex items-center gap-1.5">
                                {onPreview && (
                                    <button
                                        type="button"
                                        title="Quick preview"
                                        aria-label={`Preview ${projectName}`}
                                        tabIndex={flipped ? -1 : 0}
                                        className="grid h-9 w-9 place-items-center border-2 border-transparent text-muted-foreground hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                        onClick={() => onPreview(project.id)}
                                    >
                                        <IconEye width={16} height={16} aria-hidden="true" />
                                    </button>
                                )}
                                <span className="hud border-2 border-border px-1.5 text-[0.625rem] leading-5 text-muted-foreground">
                                    {issueCount} {issueCount === 1 ? "issue" : "issues"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 min-w-0">
                            <h3 className="truncate text-2xl leading-tight">
                                <Link
                                    to={`/projects/${project.id}`}
                                    title="Open full page"
                                    tabIndex={flipped ? -1 : 0}
                                    className="block truncate hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {projectName}
                                </Link>
                            </h3>
                            <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">{projectDescription}</p>
                        </div>

                        <div className="mt-auto pt-4">
                            {project.totalIssues != null && (
                                <dl className="mb-4 grid grid-cols-3 gap-2">
                                    {[
                                        ["Done", project.doneIssues, "DONE"],
                                        ["Active", project.inProgressIssues, "IN_PROGRESS"],
                                        ["To do", project.todoIssues, "TODO"],
                                    ].map(([term, value, status]) => (
                                        <div key={term} className={cn("min-w-0", `st-${status}`)}>
                                            <dt className="hud flex items-center gap-1 text-[0.625rem] text-muted-foreground">
                                                <StatusGlyph status={status} size={12} />
                                                {term}
                                            </dt>
                                            <dd className="px-num st-ink mt-1 text-lg leading-none">{value ?? 0}</dd>
                                        </div>
                                    ))}
                                </dl>
                            )}
                            <div className="hud flex items-center justify-between text-[0.625rem] text-muted-foreground">
                                <span>Progress</span>
                                <span className={cn("px-num text-xs", cleared ? "text-[var(--px-gold)]" : "text-foreground")}>{project.progress || 0}%</span>
                            </div>
                            <PxMeter value={project.progress || 0} className="mt-2" label={`${projectName} progress`} color={cleared ? "var(--px-gold)" : undefined} />
                            <p className="hud mt-3 flex items-center gap-1.5 text-[0.625rem] text-muted-foreground">
                                <IconReload width={12} height={12} aria-hidden="true" />
                                Click to flip for issues
                            </p>
                        </div>
                    </div>
                </div>

                <div className="project-flip-card__face project-flip-card__back border-2 border-border bg-card text-card-foreground" aria-hidden={!flipped}>
                    <div className="flex h-full flex-col p-5">
                        <div className="flex items-center justify-between gap-3 border-b-2 border-border pb-3">
                            <h3 className="truncate text-xl leading-none">{projectName}</h3>
                            <span className="hud text-[0.625rem] text-muted-foreground">{issueCount} total</span>
                        </div>

                        <ul className="mt-3 flex-1 space-y-1.5 overflow-hidden">
                            {visibleIssues.length === 0 ? (
                                <li className="border-2 border-dashed border-border p-4 text-sm text-muted-foreground">No issues in this project yet.</li>
                            ) : (
                                visibleIssues.map((issue) => (
                                    <li key={issue.id}>
                                        <button
                                            type="button"
                                            tabIndex={flipped ? 0 : -1}
                                            className={cn("grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 border-2 border-border bg-background px-2.5 py-1.5 text-left hover:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", `st-${issue.status || "NEW"}`)}
                                            onClick={() => onIssuePreview?.(issue.id)}
                                            title={STATUS_LABELS[issue.status] || issue.status}
                                        >
                                            <StatusGlyph status={issue.status || "NEW"} size={14} />
                                            <span className="flex min-w-0 items-baseline gap-2">
                                                <span className="px-num shrink-0 text-[0.6875rem] text-muted-foreground">{issue.key || `#${issue.id}`}</span>
                                                <span className="truncate text-sm">{issue.title || "Untitled issue"}</span>
                                            </span>
                                            <IssueLabelChips labels={issue.labels || []} max={2} className="col-start-2 mt-1" badgeClassName="text-[0.625rem]" />
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>

                        <Link
                            to={`/projects/${project.id}`}
                            tabIndex={flipped ? 0 : -1}
                            className="hud px-chamfer mt-3 flex h-9 items-center justify-center gap-2 border-2 border-input text-[0.6875rem] hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
                            Go to project <IconArrowRight width={14} height={14} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
