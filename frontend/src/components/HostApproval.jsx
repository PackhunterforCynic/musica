export default function HostApproval({ request, onResolve }) {
  return (
    <div style={{
      position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 50,
      background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
      border: '1px solid var(--accent)', borderRadius: '0.5rem',
      padding: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      width: '300px'
    }}>
      <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Join Request</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        <strong style={{ color: 'white' }}>{request.userName}</strong> wants to join the room.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          className="btn-primary" 
          style={{ flex: 1, padding: '0.5rem' }}
          onClick={() => onResolve(request.socketId, true, request.userName)}
        >
          Accept
        </button>
        <button 
          className="btn-secondary" 
          style={{ flex: 1, padding: '0.5rem' }}
          onClick={() => onResolve(request.socketId, false, request.userName)}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
