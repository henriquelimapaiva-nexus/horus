// src/components/ComparisonChart.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { colors, spacing, typography } from "../styles/theme";

const ComparisonChart = ({ data, title, height = 400 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        textAlign: "center", 
        padding: spacing["3xl"],
        color: colors.text.secondary
      }}>
        Sem dados suficientes para exibir o gráfico
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: colors.background.primary,
          padding: spacing.md,
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          border: `1px solid ${colors.border.light}`
        }}>
          <p style={{ fontWeight: typography.fontWeight.bold, marginBottom: spacing.xs }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: `${spacing.xs} 0` }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%", height: `${height}px`, minHeight: "400px" }}>
      {title && (
        <h3 style={{ 
          marginBottom: spacing.lg,
          color: colors.text.primary,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold
        }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} />
          <XAxis 
            dataKey="mes" 
            stroke={colors.text.secondary}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke={colors.text.secondary}
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
            label={{ 
              value: "Percentual (%)", 
              angle: -90, 
              position: "insideLeft",
              style: { fontSize: 12, fill: colors.text.secondary }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="oee" 
            stroke={colors.primary.blue} 
            strokeWidth={3}
            dot={{ fill: colors.primary.blue, strokeWidth: 2 }}
            name="OEE Global"
          />
          <Line 
            type="monotone" 
            dataKey="disponibilidade" 
            stroke={colors.status.info} 
            strokeWidth={2}
            dot={{ fill: colors.status.info }}
            name="Disponibilidade"
          />
          <Line 
            type="monotone" 
            dataKey="performance" 
            stroke={colors.status.warning} 
            strokeWidth={2}
            dot={{ fill: colors.status.warning }}
            name="Performance"
          />
          <Line 
            type="monotone" 
            dataKey="qualidade" 
            stroke={colors.status.success} 
            strokeWidth={2}
            dot={{ fill: colors.status.success }}
            name="Qualidade"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;