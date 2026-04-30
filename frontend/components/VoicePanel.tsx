'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type PanelState = 'idle' | 'listening' | 'processing' | 'speaking' | 'confirm' | 'error';

interface VoiceIntent {
  action: 'launch' | 'stop' | 'status' | 'balance' | 'browse' | 'help' | 'unknown';
  agentId: string | null;
  agentType: string | null;
  amount: number | null;
  currency: string | null;
}

interface ParseResult {
  transcript: string;
  intent: VoiceIntent;
  confirmationMessage: string;
  requiresConfirmation: boolean;
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// ── Puter type shim (loaded via CDN script tag) ───────────────────────────────
declare global {
  interface Window {
    puter?: {
      ai: {
        speech2text: (file: File | Blob) => Promise<{ text: string }>;
      };
    };
  }
}

export default function VoicePanel() {
  const [state, setState] = useState<PanelState>('idle');
  const [transcript, setTranscript] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ── Inject Puter.js script once ───────────────────────────────────────────
  useEffect(() => {
    if (document.querySelector('script[src*="puter.com"]')) return;
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // ── TTS helper ────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.lang = 'en-US';
    utter.onend = () => setState('idle');
    setState('speaking');
    window.speechSynthesis.speak(utter);
  }, []);

  // ── Start recording ───────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    setError('');
    setTranscript('');
    setParseResult(null);
    setState('listening');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAndParse(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      setError('Microphone access denied. Please allow mic permissions.');
      setState('error');
    }
  }, []);

  // ── Stop recording ────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setState('processing');
  }, []);

  // ── Transcribe via Puter.js → parse via backend ───────────────────────────
  const transcribeAndParse = useCallback(async (audioBlob: Blob) => {
    setState('processing');
    try {
      // Step 1: Puter.js speech-to-text (runs client-side, free, no API key)
      if (!window.puter) {
        throw new Error('Puter.js not loaded yet — please try again in a moment.');
      }

      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const result = await window.puter.ai.speech2text(audioFile);
      const text = result?.text?.trim();

      if (!text) {
        speak("I didn't catch that — please try again.");
        return;
      }

      setTranscript(text);
      console.log('[VoicePanel] Puter transcript:', text);

      // Step 2: Send transcript to backend for Gemini intent parsing
      const parseRes = await fetch(`${BACKEND}/api/voice/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      if (!parseRes.ok) throw new Error('Intent parsing failed');
      const parsed: ParseResult = await parseRes.json();
      setParseResult(parsed);

      if (parsed.requiresConfirmation) {
        // On-chain actions need explicit wallet confirmation
        setState('confirm');
        speak(parsed.confirmationMessage);
      } else {
        // Read-only actions: just speak and execute
        speak(parsed.confirmationMessage);
        await executeIntent(parsed.intent);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setState('error');
      speak('Something went wrong. Please try again.');
    }
  }, [speak]);

  // ── Execute intent (read-only actions; on-chain goes through wallet modal) ─
  const executeIntent = useCallback(async (intent: VoiceIntent) => {
    // Dispatch custom event — let the parent page handle navigation / wallet
    window.dispatchEvent(new CustomEvent('trovia:voice-intent', { detail: intent }));
  }, []);

  const confirmAction = useCallback(async () => {
    if (!parseResult) return;
    setState('processing');
    speak(`Confirmed. ${parseResult.confirmationMessage.replace('— confirm?', '')}`);
    await executeIntent(parseResult.intent);
  }, [parseResult, speak, executeIntent]);

  const cancelAction = useCallback(() => {
    speak('Cancelled.');
    setState('idle');
    setParseResult(null);
  }, [speak]);

  // ── FAB icon by state ─────────────────────────────────────────────────────
  const fabIcon = {
    idle:       '🎤',
    listening:  '⏹',
    processing: '⏳',
    speaking:   '🔊',
    confirm:    '❓',
    error:      '⚠️',
  }[state];

  const fabColor = {
    idle:       '#7c3aed',
    listening:  '#dc2626',
    processing: '#d97706',
    speaking:   '#0891b2',
    confirm:    '#059669',
    error:      '#9f1239',
  }[state];

  return (
    <>
      {/* Floating action button */}
      <button
        id="voice-fab"
        onClick={() => {
          if (state === 'idle') { setIsVisible(true); startListening(); }
          else if (state === 'listening') stopListening();
          else if (state === 'error') { setState('idle'); setError(''); }
        }}
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: fabColor,
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: state === 'listening'
            ? `0 0 0 8px rgba(220,38,38,0.25), 0 4px 20px rgba(0,0,0,0.4)`
            : '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'all 0.25s ease',
          zIndex: 9999,
          animation: state === 'listening' ? 'pulse 1.2s ease-in-out infinite' : 'none',
        }}
        title={state === 'idle' ? 'Click to speak' : state === 'listening' ? 'Click to stop' : state}
      >
        {fabIcon}
      </button>

      {/* Bottom drawer */}
      {isVisible && (
        <div
          id="voice-drawer"
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '28px',
            width: '340px',
            background: 'rgba(15, 17, 26, 0.97)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '16px',
            padding: '20px',
            zIndex: 9998,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.9rem' }}>
              🎙 Voice Command
            </span>
            <button
              onClick={() => { setIsVisible(false); setState('idle'); mediaRecorderRef.current?.stop(); }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem' }}
            >✕</button>
          </div>

          {/* State indicator */}
          <div style={{
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '12px',
            fontSize: '0.78rem',
            color: '#94a3b8',
          }}>
            {state === 'idle' && 'Click the mic to speak a command'}
            {state === 'listening' && <span style={{ color: '#f87171' }}>🔴 Listening… click ⏹ to stop</span>}
            {state === 'processing' && <span style={{ color: '#fbbf24' }}>⏳ Transcribing with Puter.js…</span>}
            {state === 'speaking' && <span style={{ color: '#60a5fa' }}>🔊 Speaking…</span>}
            {state === 'confirm' && <span style={{ color: '#34d399' }}>❓ Confirm action below</span>}
            {state === 'error' && <span style={{ color: '#f87171' }}>⚠️ {error}</span>}
          </div>

          {/* Live transcript */}
          {transcript && (
            <div style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '12px',
              fontSize: '0.82rem',
              color: '#e2e8f0',
              fontStyle: 'italic',
            }}>
              "{transcript}"
            </div>
          )}

          {/* Confirmation card */}
          {state === 'confirm' && parseResult && (
            <div style={{
              background: 'rgba(5,150,105,0.1)',
              border: '1px solid rgba(5,150,105,0.3)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '12px',
            }}>
              <div style={{ fontSize: '0.82rem', color: '#6ee7b7', marginBottom: '10px' }}>
                {parseResult.confirmationMessage}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  id="voice-confirm-yes"
                  onClick={confirmAction}
                  style={{
                    flex: 1, padding: '8px', background: '#059669', border: 'none',
                    borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem',
                  }}
                >
                  ✓ Confirm
                </button>
                <button
                  id="voice-confirm-no"
                  onClick={cancelAction}
                  style={{
                    flex: 1, padding: '8px', background: '#1e293b', border: '1px solid #334155',
                    borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem',
                  }}
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          )}

          {/* Hint */}
          <div style={{ fontSize: '0.7rem', color: '#334155', textAlign: 'center' }}>
            Powered by Puter.js STT + Gemini Intent Parser
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4), 0 4px 20px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(220,38,38,0), 0 4px 20px rgba(0,0,0,0.4); }
        }
      `}</style>
    </>
  );
}
