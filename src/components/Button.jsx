export default function Button({ children, onClick, variant = '', disabled = false, type = 'button' }) {
  const cls = ['btn', variant === 'submit' ? 'btn-submit' : '', variant === 'danger' ? 'btn-danger' : ''].filter(Boolean).join(' ');
  return (
    <button className={cls} onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  );
}
