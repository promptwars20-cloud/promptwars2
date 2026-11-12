import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Moon, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  AlertOctagon, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  CloudRain, 
  Sparkles, 
  Zap,
  Coffee
} from 'lucide-react';

const ROASTS = [
  "Oh look, someone clicked away to check social media again...",
  "Distraction strike! That exam isn't going to study for itself.",
  "Tab switch detected. Your GPA just shed a single tear.",
  "Focus lost! Lock in, you've got this!",
  "Another tab switch? The syllabus is expanding exponentially."
];

const INITIAL_TASKS = [
  { id: 1, title: 'Deep Work: Read 20 pages of Computer Networks', completed: false },
  { id: 2, title: 'Solve 3 Dynamic Programming problems', completed: true },
  { id: 3, title: 'Draft Literature Review for Seminar', completed: false }
];

export default function App() {
  const [timerMode, setTimerMode] = useState('pomodoro'); // pomodoro (25) | deep (50) | break (5)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [streakMinutes, setStreakMinutes] = useState(() => {
    return parseInt(localStorage.getItem('lockin_minutes') || '120', 10);
  });

  // Distraction penalty
  const [distractions, setDistractions] = useState(0);
  const [currentRoast, setCurrentRoast] = useState('');

  // Audio Synth
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [bgTheme, setBgTheme] = useState('rain'); // 'rain' | 'stars' | 'cyber'

  // Tasks
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('lockin_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [newTask, setNewTask] = useState('');

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Distraction detection via window blur
  useEffect(() => {
    const handleBlur = () => {
      if (isRunning) {
        setDistractions(d => d + 1);
        const randomRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
        setCurrentRoast(randomRoast);
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isRunning]);

  // Persist
  useEffect(() => {
    localStorage.setItem('lockin_minutes', streakMinutes.toString());
  }, [streakMinutes]);

  useEffect(() => {
    localStorage.setItem('lockin_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Timer Countdown
  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(sec => sec - 1);
        if (secondsLeft % 60 === 0) {
          setStreakMinutes(m => m + 1);
        }
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsRunning(false);
      playGong();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  // Sound Synth (Web Audio)
  const playGong = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {}
  };

  const toggleRainNoise = () => {
    if (audioPlaying) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setAudioPlaying(false);
    } else {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        // White noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Lowpass filter for cozy rain effect
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, ctx.currentTime);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();

        audioCtxRef.current = ctx;
        setAudioPlaying(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Canvas Lo-Fi Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 3 + 1,
      length: Math.random() * 20 + 10,
      opacity: Math.random() * 0.4 + 0.1
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0B0C10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (bgTheme === 'rain') {
        ctx.strokeStyle = '#A5B4FC';
        ctx.lineWidth = 1;
        particles.forEach(p => {
          ctx.beginPath();
          ctx.globalAlpha = p.opacity;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.length);
          ctx.stroke();

          p.y += p.speed * 2;
          p.x -= 0.5;
          if (p.y > canvas.height) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
          }
        });
      } else {
        // Starry dust
        particles.forEach(p => {
          ctx.fillStyle = '#F59E0B';
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.speed * 0.8, 0, Math.PI * 2);
          ctx.fill();

          p.y -= p.speed * 0.3;
          if (p.y < 0) p.y = canvas.height;
        });
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [bgTheme]);

  const switchMode = (mode, mins) => {
    setTimerMode(mode);
    setSecondsLeft(mins * 60);
    setIsRunning(false);
  };

  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([{ id: Date.now(), title: newTask.trim(), completed: false }, ...tasks]);
    setNewTask('');
  };

  return (
    <>
      <canvas id="lofi-canvas" ref={canvasRef}></canvas>
      <div className="lofi-content-wrap">
        {/* Header */}
        <header className="lofi-header">
          <div className="lofi-brand">
            <h1>LOCKINLAB 🕯️</h1>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Deep Work Sensory Chamber & Anti-Procrastination Matrix</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => setBgTheme(bgTheme === 'rain' ? 'stars' : 'rain')}
              className="btn-lofi"
            >
              {bgTheme === 'rain' ? <CloudRain size={16} /> : <Sparkles size={16} />}
              <span>{bgTheme === 'rain' ? 'Rain FX' : 'Starry FX'}</span>
            </button>
            <button 
              onClick={toggleRainNoise}
              className="btn-lofi"
              style={{ borderColor: audioPlaying ? '#38BDF8' : undefined }}
            >
              {audioPlaying ? <Volume2 size={16} color="#38BDF8" /> : <VolumeX size={16} />}
              <span>{audioPlaying ? 'Rain Audio On' : 'Rain Ambient'}</span>
            </button>
          </div>
        </header>

        {/* 3-Column Grid */}
        <div className="lofi-grid">
          {/* Left Column: Focus Vitals & Distraction Penalty Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="lofi-card">
              <div className="lofi-card-title">
                <span>Focus Retention</span>
                <Flame size={18} color="#F59E0B" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>TOTAL MINUTES LOGGED</div>
                  <div style={{ fontFamily: 'Fira Code', fontSize: '2rem', fontWeight: 700, color: '#FFF' }}>
                    {streakMinutes}m
                  </div>
                </div>
                <div style={{ padding: '8px 14px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', borderRadius: '10px', color: '#F59E0B', fontSize: '0.8rem', fontWeight: 700 }}>
                  ⚡ Flow State
                </div>
              </div>
            </div>

            {/* Distraction Penalty Box */}
            <div className="lofi-card">
              <div className="lofi-card-title">
                <span>Procrastination Penalty</span>
                <AlertOctagon size={18} color="#FB7185" />
              </div>

              <div className="penalty-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.8rem', color: '#FDA4AF', fontWeight: 600 }}>Tab Switches Away:</span>
                  <span className="penalty-count">{distractions}</span>
                </div>
                {currentRoast && (
                  <div style={{ fontSize: '0.8rem', color: '#FFF', marginTop: '8px', fontStyle: 'italic' }}>
                    "{currentRoast}"
                  </div>
                )}
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '8px' }}>
                  * Monitored via active window blur listener. Stay locked in!
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Giant Focus Chamber Timer */}
          <div className="lofi-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            {/* Mode Selectors */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button 
                onClick={() => switchMode('pomodoro', 25)}
                className={`btn-lofi ${timerMode === 'pomodoro' ? 'btn-lofi-amber' : ''}`}
              >
                25m Pomodoro
              </button>
              <button 
                onClick={() => switchMode('deep', 50)}
                className={`btn-lofi ${timerMode === 'deep' ? 'btn-lofi-amber' : ''}`}
              >
                50m Deep Work
              </button>
              <button 
                onClick={() => switchMode('break', 5)}
                className={`btn-lofi ${timerMode === 'break' ? 'btn-lofi-amber' : ''}`}
              >
                5m Rest
              </button>
            </div>

            {/* Huge Timer */}
            <div className="giant-timer-number">
              {formatTime(secondsLeft)}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-lofi btn-lofi-amber"
                onClick={() => setIsRunning(!isRunning)}
                style={{ padding: '12px 28px', fontSize: '1rem' }}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                {isRunning ? 'Pause Session' : 'Lock In Now'}
              </button>
              <button 
                className="btn-lofi"
                onClick={() => {
                  setIsRunning(false);
                  setSecondsLeft(timerMode === 'pomodoro' ? 25 * 60 : timerMode === 'deep' ? 50 * 60 : 5 * 60);
                }}
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          {/* Right Column: Deep Work Task Checklist */}
          <div className="lofi-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="lofi-card-title">
              <span>Session Milestones</span>
              <Sparkles size={18} color="#A5B4FC" />
            </div>

            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              <input 
                type="text" 
                placeholder="Commit to a task..."
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--lofi-border)', color: '#FFF', fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn-lofi" style={{ padding: '8px 12px' }}>
                <Plus size={14} />
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px' }}>
              {tasks.map(t => (
                <div 
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--lofi-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => toggleTask(t.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {t.completed ? <CheckCircle2 size={16} color="#34D399" /> : <Circle size={16} color="#6B7280" />}
                    </button>
                    <span style={{ fontSize: '0.82rem', color: t.completed ? '#6B7280' : '#E2E8F0', textDecoration: t.completed ? 'line-through' : 'none' }}>
                      {t.title}
                    </span>
                  </div>
                  <button 
                    onClick={() => setTasks(tasks.filter(x => x.id !== t.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
