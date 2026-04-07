// src/components/IndicatorCard.jsx
import React from "react";
import { colors, spacing, typography } from "../styles/theme";

const IndicatorCard = ({ 
  label, 
  value, 
  previousValue, 
  unit = "", 
  type = "default",
  icon = null,
  precision = 1,
  formatValue = null
}) => {
  
  const delta = value - previousValue;
  const deltaPercent = previousValue !== 0 ? (delta / Math.abs(previousValue)) * 100 : 0;
  const isImprovement = type === "positive" ? delta >= 0 : delta <= 0;
  const deltaColor = isImprovement ? colors.status.success : colors.status.danger;
  const deltaIcon = delta >= 0 ? "▲" : "▼";
  
  const formatarValor = (val) => {
    if (formatValue) return formatValue(val);
    if (unit === "%") return `${val.toFixed(precision)}%`;
    if (unit === "R$") return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    if (unit === "min") return `${val.toFixed(0)} min`;
    if (unit === "peças") return `${val.toFixed(0)} peças`;
    return `${val.toFixed(precision)}${unit ? ` ${unit}` : ""}`;
  };
  
  return (
    <div style={{ 
      backgroundColor: colors.background.card,
      borderRadius: "12px",
      padding: spacing.lg,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      borderLeft: `4px solid ${isImprovement ? colors.status.success : colors.status.neutral}`,
      transition: "all 0.2s ease",
      cursor: "pointer",
      height: "100%"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
        <span style={{ 
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          fontWeight: typography.fontWeight.medium,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          {label}
        </span>
        {icon && <span style={{ fontSize: "24px" }}>{icon}</span>}
      </div>
      
      <div style={{ 
        fontSize: typography.fontSize["3xl"],
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.xs,
        lineHeight: 1.2
      }}>
        {formatarValor(value)}
      </div>
      
      <div style={{ 
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
        marginBottom: spacing.sm
      }}>
        Antes: {formatarValor(previousValue)}
      </div>
      
      <div style={{ 
        display: "flex",
        alignItems: "center",
        gap: spacing.xs,
        paddingTop: spacing.sm,
        borderTop: `1px solid ${colors.border.light}`
      }}>
        <span style={{ 
          color: deltaColor,
          fontWeight: typography.fontWeight.bold,
          fontSize: typography.fontSize.base
        }}>
          {deltaIcon} {Math.abs(delta).toFixed(precision)}{unit === "%" ? "%" : ""}
        </span>
        <span style={{ 
          color: deltaColor,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium
        }}>
          ({deltaPercent >= 0 ? "+" : ""}{deltaPercent.toFixed(precision)}%)
        </span>
        <span style={{ 
          marginLeft: "auto",
          fontSize: typography.fontSize.xs,
          color: colors.text.tertiary
        }}>
          {isImprovement ? "✅ Melhoria" : "⚠️ Atenção"}
        </span>
      </div>
    </div>
  );
};

export default IndicatorCard;