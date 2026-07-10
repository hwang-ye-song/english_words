import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Moon, Sun, Plus, BookOpen, Pencil, Trash2 } from 'lucide-react';
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
  const [totalWordsCount, setTotalWordsCount] = useState(0);
  const [randomReviewCount, setRandomReviewCount] = useState(10);
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
        return numB - numA;
      });

      setSets(sortedSets);
      setTodayMastered(todayCount);
      setTotalWordsCount(words.length);
      setRandomReviewCount(Math.min(10, words.length));
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
    const input = window.prompt('몇 개의 단어로 새로운 단어장을 생성하시겠습니까? (기본 50개)', '50');
    if (input === null) return;
    const count = parseInt(input, 10);
    if (isNaN(count) || count <= 0) {
      alert('올바른 숫자를 입력해주세요.');
      return;
    }
    
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

      const finalCount = Math.min(count, unpickedWords.length);
      if (count > unpickedWords.length) {
        alert(`남은 단어가 ${unpickedWords.length}개뿐입니다. 남은 ${unpickedWords.length}개의 단어로 세트를 생성합니다.`);
      }

      // Determine next set name
      let nextSetNum = 1;
      existingData.forEach(row => {
        const num = parseInt((row.set_name || '').replace(/[^0-9]/g, '')) || 0;
        if (num >= nextSetNum) nextSetNum = num + 1;
      });
      const newSetName = `Set ${nextSetNum}`;

      // 4. Randomly pick up to finalCount words
      const shuffled = [...unpickedWords].sort(() => 0.5 - Math.random());
      const selectedWords = shuffled.slice(0, finalCount);
      
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

  const handleRenameSet = async (e, oldName) => {
    e.stopPropagation();
    const newName = window.prompt(`'${oldName}'의 새 이름을 입력하세요:`, oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;

    try {
      const { error } = await supabase
        .from('words')
        .update({ set_name: newName.trim() })
        .eq('user_id', user.id)
        .eq('set_name', oldName);

      if (error) throw error;
      showToast(`단어장 이름이 '${newName}'(으)로 변경되었습니다.`);
      loadData();
    } catch (err) {
      console.error('Failed to rename set:', err);
      alert('이름 변경 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteSet = async (e, setName) => {
    e.stopPropagation();
    if (!window.confirm(`정말로 '${setName}' 단어장을 삭제하시겠습니까?\n이 단어장 안에 있는 모든 단어 기록이 영구적으로 삭제됩니다.`)) return;

    try {
      const { error } = await supabase
        .from('words')
        .delete()
        .eq('user_id', user.id)
        .eq('set_name', setName);

      if (error) throw error;
      showToast(`'${setName}' 단어장이 삭제되었습니다.`, 'error');
      loadData();
    } catch (err) {
      console.error('Failed to delete set:', err);
      alert('단어장 삭제 중 오류가 발생했습니다.');
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
    <div className="dashboard" style={{ height: '100dvh', overflow: 'hidden', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
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
      <div className="set-list" style={{ flex: 1, minHeight: 0, marginTop: '4px', padding: '0 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>내 단어장</h3>
          <button 
            onClick={handleCreateSet}
            disabled={importing}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              background: 'var(--bg-glass-strong)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              opacity: importing ? 0.7 : 1, transition: 'all 0.2s'
            }}
            aria-label="단어장 세트 생성"
          >
            <Plus size={16} style={{ animation: importing ? 'spin 1s linear infinite' : 'none' }} />
            단어장 생성
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {sets.length === 0 ? (
            <div className="word-list-empty">
              <div className="word-list-empty-icon">📚</div>
              <h3>단어장이 비어있어요</h3>
              <p>우측 하단의 + 버튼을 눌러<br/>첫 번째 단어장 세트를 생성해 보세요!</p>
            </div>
          ) : (
          sets.map((set, idx) => (
            <div 
              key={set.name} 
              className="settings-card glass" 
              style={{ padding: '12px 16px', cursor: 'pointer', flexShrink: 0, animationDelay: `${idx * 0.1}s` }}
              onClick={() => navigate(`/set/${encodeURIComponent(set.name)}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="settings-item-icon blue" style={{ width: '32px', height: '32px' }}>
                    <BookOpen size={16} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>{set.name}</h4>
                  <div style={{ display: 'flex', gap: '2px', marginLeft: '6px' }}>
                    <button 
                      onClick={(e) => handleRenameSet(e, set.name)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px' }}
                      aria-label="이름 변경"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteSet(e, set.name)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '4px' }}
                      aria-label="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {set.mastered} / {set.total}
                </span>
              </div>
              <div className="progress-bar-bg" style={{ height: '4px', borderRadius: '2px', background: 'var(--glass-border)' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    height: '100%', 
                    borderRadius: '2px', 
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
      </div>

      {/* Global Random Review */}
      {totalWordsCount > 0 && (
        <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
          <div className="settings-card glass" style={{ padding: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔥 전체 랜덤 복습
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '16px' }}>
              지금까지 저장된 {totalWordsCount}개의 단어 중 몇 개를 복습할까요?
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="number" 
                min="1" 
                max={totalWordsCount} 
                value={randomReviewCount}
                onChange={(e) => setRandomReviewCount(Number(e.target.value))}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  padding: '12px', color: 'var(--text-primary)', fontSize: '16px', width: '80px', textAlign: 'center', fontWeight: 'bold'
                }}
              />
              <button
                onClick={() => {
                  let count = randomReviewCount;
                  if (count < 1) count = 1;
                  if (count > totalWordsCount) count = totalWordsCount;
                  navigate(`/set/random?count=${count}`);
                }}
                style={{
                  flex: 1, background: 'var(--accent-gradient)', color: 'white', border: 'none', 
                  padding: '12px', borderRadius: 'var(--radius-md)', fontWeight: 'bold',
                  boxShadow: 'var(--shadow-glow)', cursor: 'pointer'
                }}
              >
                랜덤 복습 시작
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
