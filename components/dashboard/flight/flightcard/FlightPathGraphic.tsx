import { Plane } from 'lucide-react';

export default function FlightPathGraphic({ duration, stops, transitInfo }: { duration: string, stops: string, transitInfo?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 4 }}>
      <div style={{ color: '#888', fontSize: 12, fontWeight: 400, marginBottom: 2 }}>{duration}</div>
      <div style={{ display: 'flex', alignItems: 'center', width: 100, margin: '2px 0' }}>
        <div style={{ flex: 1, borderBottom: '1px dashed #bbb', height: 1 }} />
        <Plane size={16} style={{ margin: '0 6px', color: '#888' }} />
        <div style={{ flex: 1, borderBottom: '1px dashed #bbb', height: 1 }} />
      </div>
      <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{stops}</div>
      {transitInfo && (
        <div style={{ color: '#888', fontSize: 11, marginTop: 1 }}>{transitInfo}</div>
      )}
    </div>
  );
} 