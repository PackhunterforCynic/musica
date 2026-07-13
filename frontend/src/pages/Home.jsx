import { useState } from 'react';
import CreateRoom from '../components/CreateRoom';
import JoinRoom from '../components/JoinRoom';
import { Music } from 'lucide-react';
import classNames from 'classnames';

export default function Home() {
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'

  return (
    <div className="flex justify-center items-center h-full min-h-screen">
      <div className="glass-panel p-6" style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}>
        <div className="text-center mb-6">
          <Music className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--accent)' }} />
          <h1 className="text-2xl font-bold" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Musica</h1>
          <p className="text-secondary text-sm mt-2" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Real-time synchronized listening</p>
        </div>

        <div className="flex mb-6 gap-2" style={{ display: 'flex', marginBottom: '1.5rem', gap: '0.5rem' }}>
          <button 
            className="flex-1 py-2 rounded-lg font-medium transition-colors"
            style={{ flex: 1, padding: '0.5rem 0', borderRadius: '0.5rem', fontWeight: 500, backgroundColor: activeTab === 'join' ? 'var(--accent)' : 'transparent', color: activeTab === 'join' ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveTab('join')}
          >
            Join Room
          </button>
          <button 
            className="flex-1 py-2 rounded-lg font-medium transition-colors"
            style={{ flex: 1, padding: '0.5rem 0', borderRadius: '0.5rem', fontWeight: 500, backgroundColor: activeTab === 'create' ? 'var(--accent)' : 'transparent', color: activeTab === 'create' ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveTab('create')}
          >
            Create Room
          </button>
        </div>

        {activeTab === 'join' ? <JoinRoom /> : <CreateRoom />}
      </div>
    </div>
  );
}
