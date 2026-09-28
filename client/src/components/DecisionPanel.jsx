export default function DecisionPanel({ title, children }) {
  return (
    <div className="decision-panel">
      <div className="decision-panel-heading">{title}</div>
      <div className="decision-panel-body">{children}</div>
    </div>
  );
}
