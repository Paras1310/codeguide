import { Link } from "react-router-dom";

const styles = {
  loading: {
    card: "border-cyan-400/25 bg-cyan-400/10",
    dot: "bg-cyan-300",
    title: "text-cyan-200",
  },
  error: {
    card: "border-red-400/25 bg-red-400/10",
    dot: "bg-red-300",
    title: "text-red-200",
  },
  empty: {
    card: "border-slate-700 bg-slate-900",
    dot: "bg-slate-400",
    title: "text-slate-100",
  },
  warning: {
    card: "border-amber-400/25 bg-amber-400/10",
    dot: "bg-amber-300",
    title: "text-amber-200",
  },
  success: {
    card: "border-green-400/25 bg-green-400/10",
    dot: "bg-green-300",
    title: "text-green-200",
  },
};

function PageState({
  type = "empty",
  title,
  message,
  actionLabel,
  actionTo,
  onAction,
}) {
  const currentStyle = styles[type] || styles.empty;

  return (
    <div className={`rounded-2xl border p-6 ${currentStyle.card}`}>
      <div className="flex items-start gap-4">
        <span
          className={`mt-2 h-3 w-3 shrink-0 rounded-full ${currentStyle.dot}`}
        />

        <div>
          <h2 className={`text-xl font-bold ${currentStyle.title}`}>
            {title}
          </h2>

          {message ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              {message}
            </p>
          ) : null}

          {actionTo && actionLabel ? (
            <Link
              to={actionTo}
              className="mt-5 inline-block rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              {actionLabel}
            </Link>
          ) : null}

          {onAction && actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function LoadingState({
  title = "Loading",
  message = "Please wait while the data is being loaded.",
}) {
  return <PageState type="loading" title={title} message={message} />;
}

export function ErrorState({
  title = "Something went wrong",
  message = "The requested data could not be loaded.",
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <PageState
      type="error"
      title={title}
      message={message}
      actionLabel={actionLabel}
      actionTo={actionTo}
      onAction={onAction}
    />
  );
}

export function EmptyState({
  title = "No data available",
  message = "There is nothing to show here yet.",
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <PageState
      type="empty"
      title={title}
      message={message}
      actionLabel={actionLabel}
      actionTo={actionTo}
      onAction={onAction}
    />
  );
}

export function WarningState({
  title = "Action required",
  message,
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <PageState
      type="warning"
      title={title}
      message={message}
      actionLabel={actionLabel}
      actionTo={actionTo}
      onAction={onAction}
    />
  );
}

export function SuccessState({
  title = "Success",
  message,
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <PageState
      type="success"
      title={title}
      message={message}
      actionLabel={actionLabel}
      actionTo={actionTo}
      onAction={onAction}
    />
  );
}

export default PageState;