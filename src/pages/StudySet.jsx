import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, X as XIcon, Circle as CircleIcon, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import WordCard from '../components/WordCard';
import WordModal from '../components/WordModal';

export default function StudySet() {
  const { setName } = useParams();
  const decodedSetName = decodeURIComponent(setName);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editWord, setEditWord] = useState(null);
  
  // Flashcard Queue States
  const [studyQueue, setStudyQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState('all'); // all, learning, mastered
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  
  const [toast, setToast] = useState(null);

  const loadWords = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', user.id)
      .eq('set_name', decodedSetName)
      .order('is_mastered', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWords(data);
    }
    setLoading(false);
  }, [user, decodedSetName]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Build the queue when filter changes or on initial load
  useEffect(() => {
    if (words.length > 0) {
      startRound(filter);
    } else {
      setStudyQueue([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, words.length]); // Don't trigger when `words` objects mutate (e.g. is_mastered flips)

  const startRound = (targetFilter, customQueue = null) => {
    setIsRoundComplete(false);
    setCurrentIndex(0);
    
    if (customQueue) {
      setStudyQueue(customQueue);
      return;
    }

    let newQueue = [];
    if (targetFilter === 'learning') newQueue = words.filter(w => !w.is_mastered);
    else if (targetFilter === 'mastered') newQueue = words.filter(w => w.is_mastered);
    else newQueue = [...words];

    setStudyQueue(newQueue);
  };

  const handleShuffleRestudy = () => {
    const unmastered = words.filter(w => !w.is_mastered);
    const shuffled = [...unmastered].sort(() => Math.random() - 0.5);
    setFilter('learning');
    startRound('learning', shuffled);
  };

  const handleSaveWord = async (wordData) => {
    if (wordData.id) {
      const { error } = await supabase
        .from('words')
        .update({
          english: wordData.english,
          korean: wordData.korean,
          pronunciation: wordData.pronunciation,
          memo_tip: wordData.memo_tip,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wordData.id);

      if (error) throw error;
      showToast('단어가 수정되었습니다 ✏️');
    } else {
      const { error } = await supabase
        .from('words')
        .insert({
          user_id: user.id,
          english: wordData.english,
          korean: wordData.korean,
          pronunciation: wordData.pronunciation,
          memo_tip: wordData.memo_tip,
          set_name: decodedSetName,
        });

      if (error) throw error;
      showToast('새 단어가 추가되었습니다 🎉');
    }
    loadWords();
  };

  const handleToggleMastered = async (id, mastered) => {
    const { error } = await supabase
      .from('words')
      .update({ is_mastered: mastered, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      // Update local words state to reflect DB changes immediately for counts and next round
      setWords(prev => prev.map(w => w.id === id ? { ...w, is_mastered: mastered } : w));
    }
  };

  const handleDeleteWord = async (id) => {
    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', id);

    if (!error) {
      setWords(prev => prev.filter(w => w.id !== id));
      showToast('단어가 삭제되었습니다', 'error');
    }
  };

  const handleMark = async (mastered) => {
    if (studyQueue.length === 0 || isRoundComplete) return;
    
    const currentWord = studyQueue[currentIndex];
    
    // Optimistic UI for toggle
    await handleToggleMastered(currentWord.id, mastered);
    
    // Advance to next card
    if (currentIndex < studyQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsRoundComplete(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < studyQueue.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleEditWord = (word) => {
    setEditWord(word);
    setModalOpen(true);
  };

  const handleAddWord = () => {
    setEditWord(null);
    setModalOpen(true);
  };

  const learningCount = words.filter(w => !w.is_mastered).length;
  const masteredCount = words.filter(w => w.is_mastered).length;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ paddingBottom: '80px' }}>
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <header className="dashboard-header" style={{ alignItems: 'center' }}>
        <button className="icon-btn" onClick={() => navigate('/')} style={{ marginRight: '12px' }}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-left">
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{decodedSetName}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            총 {words.length}단어
          </p>
        </div>
      </header>

      {/* Progress for this set */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
          <span>암기 진행률</span>
          <span style={{ fontWeight: 600 }}>{masteredCount} / {words.length}</span>
        </div>
        <div className="progress-bar-bg" style={{ height: '8px', borderRadius: '4px', background: 'var(--glass-border)' }}>
          <div 
            className="progress-bar-fill" 
            style={{ 
              height: '100%', 
              borderRadius: '4px', 
              background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
              width: words.length > 0 ? `${(masteredCount / words.length) * 100}%` : '0%',
              transition: 'width 0.4s ease'
            }} 
          />
        </div>
      </div>

      <div className="filter-tabs">
        <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          전체 <span className="count">{words.length}</span>
        </button>
        <button className={`filter-tab ${filter === 'learning' ? 'active' : ''}`} onClick={() => setFilter('learning')}>
          학습 중 <span className="count">{learningCount}</span>
        </button>
        <button className={`filter-tab ${filter === 'mastered' ? 'active' : ''}`} onClick={() => setFilter('mastered')}>
          완료 <span className="count">{masteredCount}</span>
        </button>
      </div>

      {/* Navigation and Single Flashcard View */}
      <div className="flashcard-container" style={{ padding: '0 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'stretch' }}>
        {studyQueue.length === 0 ? (
          <div className="word-list-empty" style={{ margin: 'auto' }}>
            <div className="word-list-empty-icon">📝</div>
            <h3>단어가 없습니다</h3>
            <p>조건에 맞는 단어가 없거나 비어 있습니다.</p>
          </div>
        ) : isRoundComplete ? (
          <div className="word-card glass" style={{ margin: 'auto', padding: '40px 20px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>학습 1회독 완료!</h3>
            
            {learningCount > 0 ? (
              <>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
                  수고하셨습니다!<br/>
                  아직 외우지 못한 단어가 <strong style={{color: 'var(--accent-primary)'}}>{learningCount}개</strong> 남았습니다.
                </p>
                <button 
                  onClick={handleShuffleRestudy}
                  style={{
                    background: 'var(--accent-gradient)', color: 'white', border: 'none', 
                    padding: '14px 24px', borderRadius: 'var(--radius-full)', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto',
                    boxShadow: 'var(--shadow-glow)', cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={18} />
                  틀린 단어 셔플해서 재학습
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                이 세트의 모든 단어를 완벽하게 외웠습니다!<br/>💯
              </p>
            )}
          </div>
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '400px' }}>
                {/* Find the current DB word to ensure UI updates if it changes behind the scenes */}
                <WordCard 
                  key={studyQueue[currentIndex].id}
                  word={words.find(w => w.id === studyQueue[currentIndex].id) || studyQueue[currentIndex]} 
                  onToggleMastered={handleToggleMastered} 
                  onDelete={handleDeleteWord} 
                  onEdit={handleEditWord} 
                />
              </div>
            </div>

            {/* X and O Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '10px' }}>
              <button
                onClick={() => handleMark(false)}
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--accent-danger)',
                  color: 'white',
                  border: 'none', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                aria-label="모름 (X)"
              >
                <XIcon size={32} strokeWidth={3} />
              </button>
              
              <button
                onClick={() => handleMark(true)}
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--accent-success)',
                  color: 'white',
                  border: 'none', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                aria-label="암기 완료 (O)"
              >
                <CircleIcon size={28} strokeWidth={4} />
              </button>
            </div>

            <div className="flashcard-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <button 
                className="icon-btn" 
                onClick={handlePrev} 
                disabled={currentIndex === 0}
                style={{ opacity: currentIndex === 0 ? 0.3 : 1, cursor: currentIndex === 0 ? 'default' : 'pointer' }}
              >
                <ChevronLeft size={24} />
              </button>
              
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                {currentIndex + 1} / {studyQueue.length}
              </div>
              
              <button 
                className="icon-btn" 
                onClick={handleNext} 
                disabled={currentIndex === studyQueue.length - 1}
                style={{ opacity: currentIndex === studyQueue.length - 1 ? 0.3 : 1, cursor: currentIndex === studyQueue.length - 1 ? 'default' : 'pointer' }}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </>
        )}
      </div>

      <button className="fab" onClick={handleAddWord} aria-label="단어 추가">
        <Plus size={24} />
      </button>

      <WordModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditWord(null); }} onSave={handleSaveWord} editWord={editWord} />
    </div>
  );
}
