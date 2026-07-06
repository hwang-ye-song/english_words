import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Moon, Sun, Plus, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ProgressBar from '../components/ProgressBar';
import DailyNote from '../components/DailyNote';

export default function Dashboard() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [todayMastered, setTodayMastered] = useState(0);
  const [toast, setToast] = useState(null);

  // Load words and group into sets
  const loadData = useCallback(async () => {
    if (!user) return;
    const { data: words, error } = await supabase
      .from('words')
      .select('id, set_name, is_mastered, updated_at')
      .eq('user_id', user.id);

    if (!error && words) {
      // Group by set_name
      const grouped = {};
      let todayCount = 0;
      const today = new Date().toISOString().split('T')[0];

      words.forEach(w => {
        const setName = w.set_name || '기본 세트';
        if (!grouped[setName]) {
          grouped[setName] = { name: setName, total: 0, mastered: 0 };
        }
        grouped[setName].total += 1;
        if (w.is_mastered) {
          grouped[setName].mastered += 1;
          if (w.updated_at && w.updated_at.startsWith(today)) {
            todayCount += 1;
          }
        }
      });

      // Sort sets by name (e.g. Set 1, Set 2)
      const sortedSets = Object.values(grouped).sort((a, b) => {
        const numA = parseInt(a.name.replace(/[^0-9]/g, '')) || 0;
        const numB = parseInt(b.name.replace(/[^0-9]/g, '')) || 0;
        return numA - numB;
      });

      setSets(sortedSets);
      setTodayMastered(todayCount);
    }
    setLoading(false);
  }, [user]);

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_settings')
      .select('daily_goal')
      .maybeSingle();

    if (data?.daily_goal) {
      setDailyGoal(data.daily_goal);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    loadSettings();
  }, [loadData, loadSettings]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleCreateSet = async () => {
    if (importing) return;
    if (!window.confirm('새로운 단어장 세트(50단어)를 생성하시겠습니까?')) return;
    
    setImporting(true);
    try {
      // 1. Get existing words from Supabase
      const { data: existingData, error: fetchError } = await supabase
        .from('words')
        .select('english, set_name')
        .eq('user_id', user.id);
        
      if (fetchError) throw fetchError;
      
      const existingSet = new Set(existingData.map(row => row.english));

      // 2. Load the global seed words
      const module = await import('../data/seedWords.json');
      const seedWords = module.default || module;
      
      // 3. Filter unpicked words
      const unpickedWords = seedWords.filter(word => !existingSet.has(word.english));
      
      if (unpickedWords.length === 0) {
        alert('축하합니다! 준비된 2480개의 단어를 모두 학습하셨습니다.');
        return;
      }

      // Determine next set name
      let nextSetNum = 1;
      existingData.forEach(row => {
        const num = parseInt((row.set_name || '').replace(/[^0-9]/g, '')) || 0;
        if (num >= nextSetNum) nextSetNum = num + 1;
      });
      const newSetName = `Set ${nextSetNum}`;

      // 4. Randomly pick up to 50 words
      const shuffled = [...unpickedWords].sort(() => 0.5 - Math.random());
      const selectedWords = shuffled.slice(0, 50);
      
      const wordsToInsert = selectedWords.map(word => ({
        user_id: user.id,
        english: word.english,
        korean: word.korean,
        memo_tip: word.memo_tip || null,
        is_mastered: false,
        set_name: newSetName
      }));

      // 5. Insert into Supabase
      const { error: insertError } = await supabase.from('words').insert(wordsToInsert);
      if (insertError) throw insertError;

      showToast(`'${newSetName}' 세트가 생성되었습니다! 🎉`);
      loadData(); // Reload UI
    } catch (err) {
      console.error('Failed to create set:', err);
      alert('세트 생성 중 오류가 발생했습니다.');
    } finally {
      setImporting(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '늦은 밤까지 화이팅! 🌙';
    if (hour < 12) return '좋은 아침이에요! ☀️';
    if (hour < 18) return '오늘도 화이팅! 🔥';
    return '저녁에도 열공! 🌟';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h2>VocaFlow</h2>
          <p>{getGreeting()}</p>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={toggleTheme} aria-label="테마 전환">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="icon-btn" onClick={() => navigate('/settings')} aria-label="설정">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Progress */}
      <ProgressBar current={todayMastered} goal={dailyGoal} />

      {/* Sets List */}
      <div className="set-list" style={{ marginTop: '24px', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>내 단어장</h3>
        
        {sets.length === 0 ? (
          <div className="word-list-empty" style={{ marginTop: '20px' }}>
            <div className="word-list-empty-icon">📚</div>
            <h3>단어장이 비어있어요</h3>
            <p>우측 하단의 + 버튼을 눌러<br/>첫 번째 단어장 세트를 생성해 보세요!</p>
          </div>
        ) : (
          sets.map((set, idx) => (
            <div 
              key={set.name} 
              className="settings-card glass" 
              style={{ padding: '20px', cursor: 'pointer', animationDelay: `${idx * 0.1}s` }}
              onClick={() => navigate(`/set/${encodeURIComponent(set.name)}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="settings-item-icon blue">
                    <BookOpen size={20} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{set.name}</h4>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {set.mastered} / {set.total}
                </span>
              </div>
              <div className="progress-bar-bg" style={{ height: '6px', borderRadius: '3px', background: 'var(--glass-border)' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    height: '100%', 
                    borderRadius: '3px', 
                    background: set.mastered === set.total && set.total > 0 
                      ? 'var(--success)' 
                      : 'linear-gradient(90deg, var(--primary), var(--secondary))',
                    width: set.total > 0 ? `${(set.mastered / set.total) * 100}%` : '0%',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Daily Note */}
      <div style={{ marginTop: '24px' }}>
        <DailyNote />
      </div>

      {/* FAB - Create New Set */}
      <button 
        className={`fab ${importing ? 'loading' : ''}`} 
        onClick={handleCreateSet} 
        aria-label="단어장 세트 생성"
        disabled={importing}
        style={{ opacity: importing ? 0.7 : 1 }}
      >
        <Plus size={24} style={{ animation: importing ? 'spin 1s linear infinite' : 'none' }} />
      </button>

    </div>
  );
}
