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
          /* YOUTUBE STYLE LIVE CHAT TAB */
          <div className="flex flex-col min-h-full bg-slate-950/80">
            {/* Optional Header / Filter pill - styling like YT */}
            <div className="px-4 py-2 border-b border-slate-800/60 sticky top-0 bg-slate-950/90 z-10 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300 text-xs font-medium cursor-pointer">
                <span>Live Chat</span>
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" preserveAspectRatio="xMidYMid meet"><g><path d="M12 16.5l-6-6h12l-6 6z"></path></g></svg>
              </div>
              <button className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><g><path d="M12 16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM10.5 12c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5-1.5.67-1.5 1.5zm0-6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5-1.5.67-1.5 1.5z"></path></g></svg>
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs font-medium">
                  Welcome to Live Chat! Remember to guard your privacy and abide by our Community Guidelines.
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isHostMessage = msg.senderRole === 'host';
                  return (
                    <div key={msg.id} className="flex items-start px-2 py-1.5 hover:bg-slate-800/40 rounded transition-colors group text-[13px] leading-relaxed">
                      {/* Avatar */}
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-[10px] text-white shrink-0 mt-0.5 mr-3">
                        {msg.senderName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      
                      {/* Message Content */}
                      <div className="flex-1 min-w-0 break-words">
                        <span className="inline-flex items-center space-x-1 mr-2 align-middle">
                          <span className={`font-medium ${isHostMessage ? 'text-amber-400' : 'text-slate-400'}`}>
                            {msg.senderName}
                          </span>
                          {isHostMessage && (
                            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center" title="Host">
                              <Shield className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </span>
                        <span className="text-white align-middle">{msg.text}</span>
                      </div>

                      {/* Options (visible on hover) */}
                      <div className="opacity-0 group-hover:opacity-100 px-1 shrink-0 cursor-pointer text-slate-500 hover:text-white transition-opacity">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><g><path d="M12 16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM10.5 12c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5-1.5.67-1.5 1.5zm0-6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5-1.5.67-1.5 1.5z"></path></g></svg>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Chat Input Deck (YT Style) */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-slate-950 shrink-0">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white shrink-0 mt-1">
              {localParticipant?.name?.charAt(0).toUpperCase() || 'Y'}
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-slate-400 font-medium mb-1">
                {localParticipant?.name || 'You'}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Chat..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-700 text-white text-[13px] py-1 placeholder-slate-600 focus:outline-none focus:border-slate-300 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="absolute right-0 bottom-1 p-1 text-slate-400 hover:text-white disabled:opacity-0 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
