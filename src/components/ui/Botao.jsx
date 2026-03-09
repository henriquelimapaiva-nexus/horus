// src/components/ui/Botao.jsx
import { useState } from "react";

export default function Botao({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onClick,
  fullWidth = false,
  type = 'button',
  style = {} // Aceitar estilos personalizados
}) {
  const [hover, setHover] = useState(false);

  const cores = {
    primary: { 
      bg: '#1E3A8A', 
      hover: '#0F2A6A', 
      text: 'white', 
      border: 'none'
    },
    secondary: { 
      bg: '#0f172a', 
      hover: '#020617', 
      text: 'white', 
      border: 'none'
    },
    success: { 
      bg: '#16a34a', 
      hover: '#15803d', 
      text: 'white', 
      border: 'none'
    },
    warning: { 
      bg: '#f59e0b', 
      hover: '#d97706', 
      text: 'black', 
      border: 'none'
    },
    danger: { 
      bg: '#dc2626', 
      hover: '#b91c1c', 
      text: 'white', 
      border: 'none'
    },
    outline: { 
      bg: 'transparent', 
      hover: '#f3f4f6', 
      text: '#1E3A8A', 
      border: '1px solid #1E3A8A'
    },
    // NOVA VARIANTE CUSTOM - não aplica nenhum estilo próprio
    custom: { 
      bg: 'transparent', 
      hover: 'transparent', 
      text: 'inherit', 
      border: 'none'
    }
  };

  const tamanhos = {
    sm: { padding: '4px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 32px', fontSize: '16px' }
  };

  const estilo = cores[variant] || cores.primary;
  const tamanho = tamanhos[size];

  // Se for variant custom, não aplica hover automático
  const bgColor = variant === 'custom' 
    ? style.backgroundColor || 'transparent'
    : (hover && !disabled ? estilo.hover : estilo.bg);

  const textColor = variant === 'custom'
    ? style.color || 'inherit'
    : estilo.text;

  const borderValue = variant === 'custom'
    ? style.border || 'none'
    : estilo.border;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => variant !== 'custom' && setHover(true)}
      onMouseLeave={() => variant !== 'custom' && setHover(false)}
      style={{
        ...tamanho,
        backgroundColor: bgColor,
        color: textColor,
        border: borderValue,
        borderRadius: style.borderRadius || '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: style.fontWeight || 500,
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        outline: 'none',
        boxShadow: style.boxShadow || 'none',
        ...style // Qualquer estilo passado sobrescreve os anteriores
      }}
    >
      {loading && <span style={{ animation: 'spin 1s linear infinite' }}>⌛</span>}
      {children}
    </button>
  );
}