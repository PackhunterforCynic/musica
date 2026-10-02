import React, { useState, useRef, useEffect } from 'react';
import { useRoomStore, useIsHost, SidebarTab } from '../../store/roomStore';
import { formatChatTime } from '../../utils/formatters';
import { Users, MessageSquare, Hand, Mic, MicOff, UserX, Shield, Send, Sparkles } from 'lucide-react';

interface SidebarProps {
  onSendMessage?: (text: string) => void;
  onSendReaction?: (emoji: string) => void;
  onKickUser?: (socketId: string) => void;
  onBanUser?: (socketId: string) => void;
  onAdmitUser?: (socketId: string) => void;
  onDenyUser?: (socketId: string) => void;
}


export const Sidebar: React.FC<SidebarProps> = ({ onSendMessage, onSendReaction, onKickUser, onBanUser, onAdmitUser, onDenyUser }) => {
  const activeTab = useRoomStore((s) => s.activeSidebarTab);
  const participants = useRoomStore((s) => s.participants);
  const pendingJoinRequests = useRoomStore((s) => s.pendingJoinRequests);
  const chatMessages = useRoomStore((s) => s.chatMessages);
  const unreadCount = useRoomStore((s) => s.unreadChatCount);
  const localParticipant = useRoomStore((s) => s.localParticipant);
  const isHost = useIsHost();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const setTab = (tab: SidebarTab) => {
    useRoomStore.getState().setActiveSidebarTab(tab);
  };

  useEffect(() => {
    if (activeTab === 'chat' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage?.(inputMessage);
      setInputMessage('');
    }
  };


  return (
    <div className="w-full lg:w-96 h-[400px] lg:h-[calc(100vh-8.5rem)] glass-panel border-t lg:border-t-0 lg:border-l border-slate-800/80 flex flex-col shrink-0 overflow-hidden z-20">
      {/* Tab Selector */}
      <div className="flex border-b border-slate-800/80 bg-slate-900/60 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => setTab('participants')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'participants'
              ? 'bg-slate-800 text-white shadow-md border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participants ({participants.length}){isHost && pendingJoinRequests.length > 0 ? ` • ${pendingJoinRequests.length} Waiting` : ''}</span>
        </button>

        <button
          onClick={() => setTab('chat')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all relative ${
            activeTab === 'chat'
              ? 'bg-slate-800 text-white shadow-md border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-mono text-[10px] flex items-center justify-center font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Content Drawer */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {activeTab === 'participants' ? (
          <div className="space-y-4">
            {/* Waiting Room Section for Host */}
            {isHost && pendingJoinRequests.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs font-black text-amber-300">
                  <span className="flex items-center space-x-1.5">
                    <span>⏳ Waiting Room</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold">{pendingJoinRequests.length}</span>
                  </span>
                  <span>Action Required</span>
                </div>
                <div className="space-y-2">
                  {pendingJoinRequests.map((req) => (
                    <div key={req.socketId} className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/20 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white truncate">{req.name}</span>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => onAdmitUser && onAdmitUser(req.socketId)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition cursor-pointer shadow"
                        >
                          Admit
                        </button>
                        <button
                          onClick={() => onDenyUser && onDenyUser(req.socketId)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-extrabold text-xs transition border border-rose-500/30 cursor-pointer"
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {participants.map((p) => {
                const isYou = p.id === localParticipant?.id;
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700/60 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-300 shrink-0">
                        {p.name ? p.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-bold text-white truncate">{p.name}</span>
                          {isYou && <span className="text-[10px] font-extrabold text-purple-400">(You)</span>}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-400">
                          {p.role === 'host' && (
                            <span className="text-indigo-400 font-bold flex items-center space-x-1">
                              <Shield className="w-3 h-3" />
                              <span>Host</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${p.presence === 'Speaking' ? 'bg-emerald-400 animate-ping' : p.presence === 'Away' ? 'bg-amber-400' : 'bg-sky-400'}`}></span>
                            <span>{p.presence || 'Joined'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side indicators & controls */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {p.handRaised && (
                        <span className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-bounce" title="Hand Raised">
                          <Hand className="w-4 h-4" />
                        </span>
                      )}
                      {p.hasMic ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-slate-600" />}

                      {/* Host Kick Controls (only Host can kick audience members) */}
                      {isHost && !isYou && p.role !== 'host' && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                          <button
                            onClick={() => onKickUser?.(p.id)}
                            className="p-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors text-[11px] font-bold px-2"
                            title="Kick user from studio"
                          >
                            Kick
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* CHAT TAB */
          <div className="space-y-3 flex flex-col justify-end min-h-full">
            {chatMessages.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-medium">
                No chat messages yet. Be the first to say hello!
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMine = msg.senderId === localParticipant?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-2 mb-1 px-1">
                      <span className={`text-xs font-extrabold ${msg.senderRole === 'host' ? 'text-purple-400' : 'text-slate-300'}`}>
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{formatChatTime(msg.timestamp)}</span>
                    </div>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed max-w-[85%] break-words shadow-md ${
                        isMine
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/70'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Chat Input Deck */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-slate-900/80 shrink-0">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Send a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2.5 rounded-xl glow-btn disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
