// src/components/ui/Card.jsx
export default function Card({ children, titulo, style = {} }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '20px',
      width: '100%',
      boxSizing: 'border-box',
      ...style
    }}>
      {titulo && (
        <h3 style={{
          color: '#1E3A8A',
          marginBottom: '20px',
          fontSize: '18px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '10px'
        }}>
          {titulo}
        </h3>
      )}
      {children}
    </div>
  );
}