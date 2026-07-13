import { Users, Crown } from 'lucide-react';

export default function Participants({ participants, hostId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users size={18} />
        <h3 style={{ fontWeight: 600 }}>Participants ({participants.length})</h3>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {participants.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem' }}>{p.name}</span>
            {p.id === hostId && <Crown size={16} style={{ color: '#fbbf24' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
