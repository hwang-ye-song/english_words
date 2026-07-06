import { useState } from 'react';
import { Check, Volume2, Pencil, Trash2, Lightbulb } from 'lucide-react';
import seedWords from '../data/seedWords.json';

export default function WordCard({ word, onToggleMastered, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [speaking, setSpeaking] = useState(false);

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

  const handleCardClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div 
      className={`word-card glass ${word.is_mastered ? 'mastered' : ''}`}
      onClick={handleCardClick}
      style={{ 
        cursor: 'pointer', 
        padding: '30px', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '350px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: 'var(--shadow-md)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Top Left: Check Button */}
      <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
          <button
            className={`word-check-btn ${word.is_mastered ? 'checked' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleMastered(word.id, !word.is_mastered); }}
            aria-label={word.is_mastered ? '암기 완료 해제' : '암기 완료'}
          >
            {word.is_mastered && <Check size={14} strokeWidth={3} />}
          </button>
      </div>

      {/* Top Right: Edit/Delete Actions */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
         <button
            className="word-action-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(word); }}
            aria-label="수정"
          >
            <Pencil size={18} />
          </button>
          <button
            className="word-action-btn delete"
            onClick={(e) => { e.stopPropagation(); onDelete(word.id); }}
            aria-label="삭제"
          >
            <Trash2 size={18} />
          </button>
      </div>

      {/* Front of Card: English Word */}
      <div className="word-english" style={{ fontSize: '36px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', marginTop: expanded ? '20px' : '0' }}>
        <span>{word.english}</span>
        <button
          className={`speak-btn ${speaking ? 'speaking' : ''}`}
          onClick={handleSpeak}
          aria-label="발음 듣기"
        >
          <Volume2 size={24} />
        </button>
      </div>

      {!expanded && (
        <div style={{ color: 'var(--text-tertiary)', fontSize: '15px', marginTop: '30px', animation: 'fadeIn 0.5s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>👆</span>
          <span>카드를 터치해서 뒤집기</span>
        </div>
      )}

      {/* Back of Card: Meaning, Tip, Example */}
      {expanded && (
        <div className="word-expanded-content animate-fade-in" style={{ width: '100%', marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed var(--border-color)' }}>
          <div className="word-korean" style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
            {word.korean}
          </div>

          {word.pronunciation && (
            <div className="word-pronunciation" style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--text-secondary)' }}>
              🗣 {word.pronunciation}
            </div>
          )}
          
          {word.memo_tip && (
            <div className="word-tip" style={{ marginBottom: '20px', justifyContent: 'center', padding: '10px' }}>
              <Lightbulb size={16} />
              {word.memo_tip}
            </div>
          )}

          {localExample && (
            <div className="word-example" style={{ fontSize: '15px', color: 'var(--text-primary)', fontStyle: 'italic', background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', lineHeight: '1.6', textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent-primary)', marginBottom: '8px', fontStyle: 'normal' }}>📖 필수 예문</div>
              <div style={{ marginBottom: '6px' }}>{localExample}</div>
              <div style={{ fontStyle: 'normal', color: 'var(--text-secondary)', fontSize: '14px' }}>{localExampleTranslation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
