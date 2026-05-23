"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FileStack,
  Filter,
  GraduationCap,
  LibraryBig,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  Search,
  Settings,
  Sparkles,
  Users
} from "lucide-react";
import type { AssignmentRecord } from "@vedai/shared";
import { listAssignments } from "@/lib/api";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useAuthStore } from "@/store/authStore";

function useAssignments() {
  const token = useAuthStore((state) => state.token);
  const upsertAssignment = useAssignmentStore((state) => state.upsertAssignment);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    listAssignments(token)
      .then(({ assignments: nextAssignments }) => {
        if (cancelled) return;
        setAssignments(nextAssignments);
        nextAssignments.forEach(upsertAssignment);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError instanceof Error ? requestError.message : "Unable to load assignments");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, upsertAssignment]);

  return { assignments, error, loading };
}

function WorkspaceHeader({
  eyebrow,
  title,
  copy,
  icon
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  icon?: React.ReactNode;
}) {
  return (
    <header className="workspace-heading">
      <span className="live-dot" />
      <div>
        {eyebrow && <p>{eyebrow}</p>}
        <h1>{title}</h1>
        <span>{copy}</span>
      </div>
      {icon && <div className="workspace-heading-icon">{icon}</div>}
    </header>
  );
}

function EmptyAssignments() {
  return (
    <section className="workspace-empty">
      <div className="empty-art">
        <FilePlus2 size={54} />
        <Search size={96} />
      </div>
      <h2>No assignments yet</h2>
      <p>Create your first assignment to start collecting submissions, defining criteria, and generating papers with AI.</p>
      <Link className="primary-action" href="/">
        <FilePlus2 size={20} />
        Create Your First Assignment
      </Link>
    </section>
  );
}

function AssignmentCard({ assignment }: { assignment: AssignmentRecord }) {
  const totalMarks = assignment.result?.totalMarks ?? assignment.input.numberOfQuestions * assignment.input.marksPerQuestion;

  return (
    <Link className="assignment-card" href={`/assignment/${assignment.id}`}>
      <div>
        <h2>{assignment.input.title}</h2>
        <p>{assignment.input.grade} · {assignment.input.subject}</p>
      </div>
      <span className={`status-pill ${assignment.status}`}>{assignment.status.replace("_", " ")}</span>
      <dl>
        <div>
          <dt>Assigned on</dt>
          <dd>{new Date(assignment.createdAt).toLocaleDateString()}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>{assignment.input.dueDate}</dd>
        </div>
        <div>
          <dt>Marks</dt>
          <dd>{totalMarks}</dd>
        </div>
      </dl>
    </Link>
  );
}

export function DashboardPage() {
  const { assignments, error, loading } = useAssignments();
  const completed = assignments.filter((assignment) => assignment.status === "completed").length;
  const totalMarks = assignments.reduce((sum, assignment) => {
    return sum + (assignment.result?.totalMarks ?? assignment.input.numberOfQuestions * assignment.input.marksPerQuestion);
  }, 0);

  return (
    <main className="workspace-shell">
      <WorkspaceHeader
        title="Hi, welcome back"
        copy="Ready to create, review, and organize your classroom assignments."
        icon={<Sparkles size={28} />}
      />

      <section className="dashboard-grid">
        <article className="dashboard-card dark">
          <p>Assignments created</p>
          <strong>{assignments.length}</strong>
          <span>{completed} completed</span>
        </article>
        <article className="dashboard-card">
          <p>Marks generated</p>
          <strong>{totalMarks}</strong>
          <span>Across all papers</span>
        </article>
        <article className="dashboard-card">
          <p>Time saved by AI</p>
          <strong>{Math.max(1, assignments.length * 2)} hrs</strong>
          <span>Estimated drafting time</span>
        </article>
      </section>

      <section className="workspace-panel">
        <div className="panel-title-row">
          <h2>Recent Assignments</h2>
          <Link href="/assignments">View all <ArrowRight size={16} /></Link>
        </div>
        {loading ? (
          <p className="muted-line"><LoaderCircle className="spin" size={16} /> Loading assignments</p>
        ) : error ? (
          <p className="server-error">{error}</p>
        ) : assignments.length === 0 ? (
          <EmptyAssignments />
        ) : (
          <div className="assignment-grid compact">
            {assignments.slice(0, 4).map((assignment) => (
              <AssignmentCard assignment={assignment} key={assignment.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export function AssignmentsPage() {
  const { assignments, error, loading } = useAssignments();
  const [query, setQuery] = useState("");
  const filteredAssignments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assignments;
    return assignments.filter((assignment) => {
      const haystack = `${assignment.input.title} ${assignment.input.subject} ${assignment.input.grade} ${assignment.status}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [assignments, query]);

  return (
    <main className="workspace-shell">
      <WorkspaceHeader
        title="Assignments"
        copy="Manage and create assignments for your classes."
        icon={<FileStack size={28} />}
      />

      <div className="filter-bar">
        <span><Filter size={19} /> Filter By</span>
        <label>
          <Search size={21} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Assignment" />
        </label>
      </div>

      {loading ? (
        <section className="workspace-panel">
          <p className="muted-line"><LoaderCircle className="spin" size={16} /> Loading assignments</p>
        </section>
      ) : error ? (
        <p className="server-error">{error}</p>
      ) : filteredAssignments.length === 0 ? (
        <EmptyAssignments />
      ) : (
        <div className="assignment-grid">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard assignment={assignment} key={assignment.id} />
          ))}
        </div>
      )}

      <Link className="floating-create" href="/">
        <FilePlus2 size={20} />
        Create Assignment
      </Link>
    </main>
  );
}

export function GroupsPage() {
  const groups = [
    { name: "Class 8-A", subject: "Science", students: 42, next: "Quiz on Electricity" },
    { name: "Class 7-B", subject: "Mathematics", students: 38, next: "Fractions practice" },
    { name: "Class 5", subject: "English", students: 34, next: "Grammar checkpoint" }
  ];

  return (
    <main className="workspace-shell">
      <WorkspaceHeader title="My Groups" copy="Organize classes and reuse assignment settings quickly." icon={<Users size={28} />} />
      <div className="resource-grid">
        {groups.map((group) => (
          <article className="resource-card" key={group.name}>
            <span><GraduationCap size={22} /></span>
            <h2>{group.name}</h2>
            <p>{group.subject}</p>
            <dl>
              <div><dt>Students</dt><dd>{group.students}</dd></div>
              <div><dt>Next paper</dt><dd>{group.next}</dd></div>
            </dl>
            <Link href="/">Create assignment <ArrowRight size={16} /></Link>
          </article>
        ))}
      </div>
    </main>
  );
}

export function ToolkitPage() {
  const tools = [
    { title: "Create Question Paper", copy: "Build a structured paper from source notes.", icon: FilePlus2, href: "/" },
    { title: "Rubric Builder", copy: "Draft criteria and marking guides.", icon: CheckCircle2, href: "/" },
    { title: "Feedback Summary", copy: "Turn answer trends into feedback notes.", icon: MessageSquareText, href: "/assignments" }
  ];

  return (
    <main className="workspace-shell">
      <WorkspaceHeader title="AI Teacher's Toolkit" copy="Fast AI workflows for classroom prep and evaluation." icon={<Sparkles size={28} />} />
      <div className="resource-grid">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <article className="resource-card" key={tool.title}>
              <span><Icon size={22} /></span>
              <h2>{tool.title}</h2>
              <p>{tool.copy}</p>
              <Link href={tool.href}>Open tool <ArrowRight size={16} /></Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export function LibraryPage() {
  const items = [
    { title: "CBSE Grade 8 Science", type: "Source pack", meta: "Electricity · Light · Sound" },
    { title: "Short-answer templates", type: "Question set", meta: "Reusable rubrics and marking hints" },
    { title: "Exam instructions", type: "Template", meta: "Common paper headers and directions" }
  ];

  return (
    <main className="workspace-shell">
      <WorkspaceHeader title="My Library" copy="Saved sources, templates, and reusable classroom material." icon={<LibraryBig size={28} />} />
      <div className="resource-grid">
        {items.map((item) => (
          <article className="resource-card" key={item.title}>
            <span><BookOpen size={22} /></span>
            <h2>{item.title}</h2>
            <p>{item.type}</p>
            <small>{item.meta}</small>
            <Link href="/">Use in assignment <ArrowRight size={16} /></Link>
          </article>
        ))}
      </div>
    </main>
  );
}

export function SettingsPage() {
  const { user, logout } = useAuthStore();

  return (
    <main className="workspace-shell">
      <WorkspaceHeader title="Settings" copy="Manage your account and school workspace." icon={<Settings size={28} />} />
      <section className="workspace-panel settings-panel">
        <div className="settings-row">
          <span><LockKeyhole size={22} /></span>
          <div>
            <h2>{user?.name ?? "Teacher"}</h2>
            <p>{user?.email ?? "Signed in user"}</p>
          </div>
        </div>
        <div className="settings-row">
          <span><CalendarDays size={22} /></span>
          <div>
            <h2>Delhi Public School</h2>
            <p>Bokaro Steel City · Teacher workspace</p>
          </div>
        </div>
        <button className="secondary-action" type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </section>
    </main>
  );
}
