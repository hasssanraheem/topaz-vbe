export default function Message({ type = 'info', children }) {
  return <div className={`msg-box msg-${type}`}>{children}</div>;
}
