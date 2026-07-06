import { useState } from 'react';
import { Check, Volume2, Eye, EyeOff, Pencil, Trash2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import seedWords from '../data/seedWords.json';

export default function WordCard({ word, onToggleMastered, onDelete, onEdit, hideAll }) {
  const [showMeaning, setShowMeaning] = useState(!hideAll);
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isMeaningVisible = hideAll ? showMeaning : true;
  
  const localWordInfo = seedWords.find(w => w.english === word.english);
  const localExample = localWordInfo?.example;
  const localExampleTranslation = localWordInfo?.example_translation;

  const handleSpeak = (e) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.english);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1;

      setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleMeaning = (e) => {
    e.stopPropagation();
    setShowMeaning(!showMeaning);
  };

  const handleCardClick = () => {
    // If meaning is hidden due to hideAll, first click reveals meaning
    if (hideAll && !isMeaningVisible) {
      setShowMeaning(true);
      return;
    }
    // Otherwise toggle expanded state
    setExpanded(!expanded);
  };

  return (
    <div 
      className={`word-card glass ${word.is_mastered ? 'mastered' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer', padding: '20px 20px 12px 20px', display: 'flex', flexDirection: 'column' }}
    >
      <div className="word-card-main">
        <div className="word-check" onClick={(e) => e.stopPropagation()}>
          <button
            className={`word-check-btn ${word.is_mastered ? 'checked' : ''}`}
            onClick={() => onToggleMastered(word.id, !word.is_mastered)}
            aria-label={word.is_mastered ? '암기 완료 해제' : '암기 완료'}
          >
            {word.is_mastered && <Check size={14} strokeWidth={3} />}
          </button>
        </div>

        <div className="word-content" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="word-english" style={{ fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span>{word.english}</span>
            <button
              className={`speak-btn ${speaking ? 'speaking' : ''}`}
              onClick={handleSpeak}
              aria-label="발음 듣기"
            >
              <Volume2 size={16} />
            </button>
          </div>

          <div
            className={`word-korean ${!isMeaningVisible && hideAll ? 'hidden' : ''}`}
            style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-secondary)' }}
          >
            {word.korean}
          </div>

          {/* Expanded Content (Flashcard Back) */}
          {expanded && isMeaningVisible && (
            <div className="word-expanded-content animate-fade-in" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              {word.pronunciation && (
                <div className="word-pronunciation" style={{ marginBottom: '10px', fontSize: '14px' }}>
                  🗣 {word.pronunciation}
                </div>
              )}
              
              {word.memo_tip && (
                <div className="word-tip" style={{ marginBottom: '12px' }}>
                  <Lightbulb size={14} />
                  {word.memo_tip}
                </div>
              )}

              {localExample && (
                <div className="word-example" style={{ fontSize: '14.5px', color: 'var(--text-primary)', fontStyle: 'italic', background: 'var(--bg-input)', padding: '12px', borderRadius: '10px', lineHeight: '1.5' }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--accent-primary)', marginBottom: '6px', fontStyle: 'normal' }}>📖 필수 예문</div>
                  <div style={{ marginBottom: '4px' }}>{localExample}</div>
                  <div style={{ fontStyle: 'normal', color: 'var(--text-secondary)', fontSize: '13.5px' }}>{localExampleTranslation}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="word-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`word-action-btn ${hideAll ? 'toggle-active' : ''}`}
            onClick={handleToggleMeaning}
            aria-label="뜻 토글"
          >
            {isMeaningVisible || !hideAll ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button
            className="word-action-btn"
            onClick={() => onEdit(word)}
            aria-label="수정"
          >
            <Pencil size={18} />
          </button>
          <button
            className="word-action-btn delete"
            onClick={() => onDelete(word.id)}
            aria-label="삭제"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      {/* Expand Indicator */}
      {isMeaningVisible && (
        <div style={{ textAlign: 'center', marginTop: '12px', color: 'var(--text-tertiary)', opacity: 0.4, display: 'flex', justifyContent: 'center' }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      )}
    </div>
  );
}
