import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, EyeOff, Eye } from 'lucide-react';
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
  const [hideAll, setHideAll] = useState(false);
  const [filter, setFilter] = useState('all');
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
      setWords(prev =>
        prev.map(w => w.id === id ? { ...w, is_mastered: mastered } : w)
          .sort((a, b) => {
            if (a.is_mastered !== b.is_mastered) return a.is_mastered ? 1 : -1;
            return new Date(b.created_at) - new Date(a.created_at);
          })
      );
      if (mastered) showToast('암기 완료! 👏');
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

  const handleEditWord = (word) => {
    setEditWord(word);
    setModalOpen(true);
  };

  const handleAddWord = () => {
    setEditWord(null);
    setModalOpen(true);
  };

  const filteredWords = words.filter(w => {
    if (filter === 'learning') return !w.is_mastered;
    if (filter === 'mastered') return w.is_mastered;
    return true;
  });

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

      <div className="hide-all-toggle">
        <button className={`hide-all-btn ${hideAll ? 'active' : ''}`} onClick={() => setHideAll(!hideAll)}>
          {hideAll ? <EyeOff size={14} /> : <Eye size={14} />}
          {hideAll ? '뜻 가리기 ON' : '뜻 가리기 OFF'}
        </button>
      </div>

      <div className="word-list">
        {filteredWords.length === 0 ? (
          <div className="word-list-empty">
            <div className="word-list-empty-icon">📝</div>
            <h3>단어가 없습니다</h3>
            <p>아래 + 버튼을 눌러 단어를 추가해 보세요!</p>
          </div>
        ) : (
          filteredWords.map((word, index) => (
            <div key={word.id} style={{ animationDelay: `${index * 0.05}s` }}>
              <WordCard word={word} hideAll={hideAll} onToggleMastered={handleToggleMastered} onDelete={handleDeleteWord} onEdit={handleEditWord} />
            </div>
          ))
        )}
      </div>

      <button className="fab" onClick={handleAddWord} aria-label="단어 추가">
        <Plus size={24} />
      </button>

      <WordModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditWord(null); }} onSave={handleSaveWord} editWord={editWord} />
    </div>
  );
}
