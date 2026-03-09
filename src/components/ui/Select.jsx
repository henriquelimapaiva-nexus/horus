// src/components/ui/Select.jsx
export default function Select({
  label,
  value,
  onChange,
  options = [],
  required = false,
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
      <select
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #d1d5db',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
          backgroundColor: 'white'
        }}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}