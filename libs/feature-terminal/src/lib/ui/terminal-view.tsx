import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Terminal, type IDisposable } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Plus,
  Terminal as TerminalIcon,
} from 'lucide-react';
import { cn } from '@ai-workbench/shared/utils';
import { AGENT_COLORS, type TerminalSession } from '../terminal.types';
import 'xterm/css/xterm.css';

const AGENT_OPTIONS = [
  { id: 'executor-agent', label: 'Executor' },
  { id: 'planner-agent', label: 'Planner' },
  { id: 'reviewer-agent', label: 'Reviewer' },
] as const;

export const TerminalView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const currentAgentRef = useRef<string>(AGENT_OPTIONS[0].id);
  const isPausedRef = useRef(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(AGENT_OPTIONS[0].id);
  const [connectedAgents, setConnectedAgents] = useState<string[]>([]);

  sessionIdRef.current = sessionId;
  currentAgentRef.current = currentAgent;
  isPausedRef.current = isPaused;

  const refreshSessions = useCallback(async () => {
    if (!window.terminalAPI) return;
    try {
      const result = await window.terminalAPI.listSessions({});
      if (result.success) {
        setSessions(result.sessions);
      }
    } catch (error) {
      console.error('Failed to load terminal sessions', error);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || terminalInstanceRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: '"JetBrains Mono", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#e5e5e5',
        cursor: '#00f0ff',
        selectionBackground: 'rgba(0, 240, 255, 0.3)',
      },
      rows: 24,
      cols: 80,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => {
      fitAddon.fit();
      if (sessionIdRef.current && window.terminalAPI) {
        window.terminalAPI.resize(
          sessionIdRef.current,
          currentAgentRef.current,
          term.cols,
          term.rows,
        );
      }
    };

    const inputDisposable: IDisposable = term.onData((data) => {
      if (
        sessionIdRef.current &&
        !isPausedRef.current &&
        window.terminalAPI
      ) {
        void window.terminalAPI.write(
          sessionIdRef.current,
          currentAgentRef.current,
          data,
        );
      }
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      inputDisposable.dispose();
      term.dispose();
      fitAddon.dispose();
      terminalInstanceRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    if (!window.terminalAPI || !terminalInstanceRef.current) return;

    const subscriptions: Array<() => void> = [
      window.terminalAPI.onData((sid, data) => {
        if (sid === sessionIdRef.current) {
          terminalInstanceRef.current?.write(data);
        }
      }),
      window.terminalAPI.onSessionCreated(async () => {
        await refreshSessions();
      }),
      window.terminalAPI.onAgentJoined(({ sessionId: sid, agentId }) => {
        if (sid !== sessionIdRef.current) return;
        setConnectedAgents((prev) =>
          prev.includes(agentId) ? prev : [...prev, agentId],
        );
      }),
      window.terminalAPI.onAgentLeft(({ sessionId: sid, agentId }) => {
        if (sid !== sessionIdRef.current) return;
        setConnectedAgents((prev) => prev.filter((id) => id !== agentId));
      }),
    ];

    return () => {
      subscriptions.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch {
          // no-op cleanup guard
        }
      });
    };
  }, [refreshSessions]);

  useEffect(() => {
    if (!sessionId) {
      setConnectedAgents([]);
    }
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (sessionIdRef.current && window.terminalAPI) {
        void window.terminalAPI.leaveSession({
          sessionId: sessionIdRef.current,
          agentId: currentAgentRef.current,
        });
      }
    };
  }, []);

  const handleCreate = useCallback(async () => {
    if (!window.terminalAPI || !terminalInstanceRef.current) return;

    const res = await window.terminalAPI.createSession({
      projectId: 'active-project',
      name: `Term ${sessions.length + 1}`,
      agentId: currentAgent,
    });

    if (res.success && res.sessionId) {
      setSessionId(res.sessionId);
      setConnectedAgents([currentAgent]);
      terminalInstanceRef.current.clear();
      terminalInstanceRef.current.writeln(
        `\u001b[32m>>> Session Created: ${res.sessionId}\u001b[0m\r\n`,
      );
      await refreshSessions();
    }
  }, [currentAgent, refreshSessions, sessions.length]);

  const handleJoin = useCallback(
    async (id: string) => {
      if (!window.terminalAPI || !terminalInstanceRef.current) return;

      if (sessionIdRef.current) {
        await window.terminalAPI.leaveSession({
          sessionId: sessionIdRef.current,
          agentId: currentAgent,
        });
      }

      await window.terminalAPI.joinSession({
        sessionId: id,
        agentId: currentAgent,
      });

      setSessionId(id);
      setConnectedAgents([currentAgent]);
      terminalInstanceRef.current.clear();
      terminalInstanceRef.current.writeln(
        `\u001b[32m>>> Joined Session: ${id}\u001b[0m\r\n`,
      );
    },
    [currentAgent],
  );

  const handleKill = useCallback(async () => {
    if (!sessionIdRef.current || !window.terminalAPI) return;
    await window.terminalAPI.kill(sessionIdRef.current, currentAgent);
    await refreshSessions();
    setSessionId(null);
    setConnectedAgents([]);
    terminalInstanceRef.current?.clear();
  }, [currentAgent, refreshSessions]);

  return (
    <div className="flex h-full bg-neutral-950 text-neutral-200">
      <div className="w-64 flex flex-col border-r border-neutral-800 bg-neutral-900/50">
        <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Terminals
          </span>
          <button
            type="button"
            onClick={refreshSessions}
            className="text-neutral-500 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 && (
            <div className="text-[10px] text-neutral-600 text-center py-4">
              No active sessions
            </div>
          )}

          {sessions.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => s.id !== sessionId && handleJoin(s.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  s.id !== sessionId && handleJoin(s.id);
                }
              }}
              className={cn(
                'p-2 rounded cursor-pointer border border-transparent text-xs group outline-none focus-visible:ring-1 focus-visible:ring-primary',
                s.id === sessionId
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'hover:bg-neutral-800',
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold truncate">{s.metadata.name}</span>
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    s.state.isActive ? 'bg-emerald-500' : 'bg-red-500',
                  )}
                />
              </div>
              <div className="text-[10px] opacity-70 flex gap-2">
                <span>{`${s.id.substring(0, 8)}...`}</span>
                <span>{`${s.agentIds.length} agents`}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-neutral-800 space-y-3 bg-neutral-900">
          <div>
            <label className="text-[10px] uppercase text-neutral-500 font-bold">
              Identity
            </label>
            <select
              value={currentAgent}
              onChange={(event) => setCurrentAgent(event.target.value)}
              className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded text-xs px-2 py-1.5"
            >
              {AGENT_OPTIONS.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded py-1.5 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
            <button
              type="button"
              onClick={handleKill}
              disabled={!sessionId}
              className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Kill
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-neutral-950">
        <div className="h-9 border-b border-neutral-800 flex items-center justify-between px-4 bg-neutral-900/30">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>{sessionId ? `Active: ${sessionId}` : 'Disconnected'}</span>
          </div>

          {sessionId && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1 mr-3">
                {connectedAgents.map((agent) => (
                  <div
                    key={agent}
                    className="w-2.5 h-2.5 rounded-full border border-neutral-900"
                    style={{
                      backgroundColor: AGENT_COLORS[agent] || '#ffffff',
                    }}
                    title={agent}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="hover:text-white text-neutral-500"
              >
                {isPaused ? (
                  <Play className="w-3.5 h-3.5" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 p-2 relative">
          {!sessionId && (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-700 pointer-events-none">
              <div className="text-center">
                <TerminalIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-xs uppercase tracking-widest">
                  No Active Session
                </p>
              </div>
            </div>
          )}
          <div
            ref={containerRef}
            className={cn('h-full w-full', !sessionId && 'opacity-0')}
          />
        </div>
      </div>
    </div>
  );
};
