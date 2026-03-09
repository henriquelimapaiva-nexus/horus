// src/components/ui/Input.jsx
export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
  step,
  help,
  style = {}
}) {
  return (
    <div style={{ marginBottom: '15px', ...style }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '6px',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #d1d5db',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
      {help && (
        <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          {help}
        </small>
      )}
    </div>
  );
}