import { useState, useEffect } from 'react';
import { Check, Volume2, Pencil, Trash2, Lightbulb, X, Circle } from 'lucide-react';
import seedWords from '../data/seedWords.json';

export default function WordCard({ word, onToggleMastered, onDelete, onEdit, onSwipeLeft, onSwipeRight }) {
  const [expanded, setExpanded] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speakingExample, setSpeakingExample] = useState(false);
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [exitDirection, setExitDirection] = useState(null);
  
  const minSwipeDistance = 80;

  const localWordInfo = seedWords.find(w => w.english === word.english);
  const localExample = localWordInfo?.example;
  const localExampleTranslation = localWordInfo?.example_translation;

  const handleSpeak = (e) => {
    if (e) e.stopPropagation();
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

  const handleSpeakExample = (e) => {
    if (e) e.stopPropagation();
    if (!localExample) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(localExample);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1;

      setSpeakingExample(true);
      utterance.onend = () => setSpeakingExample(false);
      utterance.onerror = () => setSpeakingExample(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    handleSpeak();
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCardClick = () => {
    // Only expand if we aren't swiping
    if (Math.abs(swipeOffset) < 10) {
      setExpanded(!expanded);
    }
  };

  const handleStart = (clientX) => {
    setTouchEnd(null);
    setTouchStart(clientX);
  };

  const handleMove = (clientX) => {
    if (touchStart === null) return;
    setTouchEnd(clientX);
    setSwipeOffset(clientX - touchStart);
  };

  const handleEnd = () => {
    if (touchStart === null || touchEnd === null) {
      setSwipeOffset(0);
      setTouchStart(null);
      return;
    }
    const distance = touchStart - touchEnd;
    
    if (distance > minSwipeDistance && onSwipeLeft) {
      setExitDirection('left');
      setTimeout(() => onSwipeLeft(), 300);
    } else if (distance < -minSwipeDistance && onSwipeRight) {
      setExitDirection('right');
      setTimeout(() => onSwipeRight(), 300);
    } else {
      setSwipeOffset(0);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Mouse event wrappers
  const handleMouseDown = (e) => handleStart(e.clientX);
  const handleMouseMove = (e) => {
    if (touchStart !== null) handleMove(e.clientX);
  };
  const handleMouseUp = () => handleEnd();
  const handleMouseLeave = () => {
    if (touchStart !== null) handleEnd();
  };

  // Touch event wrappers
  const handleTouchStartEvent = (e) => handleStart(e.targetTouches[0].clientX);
  const handleTouchMoveEvent = (e) => handleMove(e.targetTouches[0].clientX);
  const handleTouchEndEvent = () => handleEnd();

  const displayOffset = exitDirection === 'left' ? -1500 : exitDirection === 'right' ? 1500 : swipeOffset;
  const foldSize = Math.abs(displayOffset);
  const isLeftFold = displayOffset < 0;
  const isRightFold = displayOffset > 0;

  let clipPath = 'none';
  if (isLeftFold && foldSize > 0) {
    clipPath = `polygon(0 0, calc(100% - ${foldSize}px) 0, 100% ${foldSize}px, 100% 100%, 0 100%)`;
  } else if (isRightFold && foldSize > 0) {
    clipPath = `polygon(${foldSize}px 0, 100% 0, 100% 100%, 0 100%, 0 ${foldSize}px)`;
  }

  return (
    <div 
      className="word-card glass"
      onClick={handleCardClick}
      onTouchStart={handleTouchStartEvent}
      onTouchMove={handleTouchMoveEvent}
      onTouchEnd={handleTouchEndEvent}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ 
        cursor: touchStart ? 'grabbing' : 'grab',
        userSelect: 'none',
        padding: '30px', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '350px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: 'var(--shadow-md)',
        clipPath: clipPath,
        transition: touchStart ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Flap for Left Swipe (Fail / Red) - Top Right Corner */}
      {isLeftFold && foldSize > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: `${foldSize}px`,
          height: `${foldSize}px`,
          background: 'linear-gradient(to top right, rgba(248, 113, 113, 0.95) 50%, transparent 50%)',
          filter: 'drop-shadow(-3px 3px 6px rgba(0,0,0,0.4))',
          pointerEvents: 'none',
          transition: touchStart ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 10
        }} />
      )}

      {/* Flap for Right Swipe (Memorized / Green) - Top Left Corner */}
      {isRightFold && foldSize > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${foldSize}px`,
          height: `${foldSize}px`,
          background: 'linear-gradient(to top left, rgba(74, 222, 128, 0.95) 50%, transparent 50%)',
          filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.4))',
          pointerEvents: 'none',
          transition: touchStart ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 10
        }} />
      )}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent-primary)', fontStyle: 'normal' }}>📖 필수 예문</div>
                <button
                  className={`speak-btn ${speakingExample ? 'speaking' : ''}`}
                  onClick={handleSpeakExample}
                  aria-label="예문 발음 듣기"
                  style={{ width: '28px', height: '28px', background: 'rgba(124, 92, 255, 0.15)' }}
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <div style={{ marginBottom: '6px' }}>{localExample}</div>
              <div style={{ fontStyle: 'normal', color: 'var(--text-secondary)', fontSize: '14px' }}>{localExampleTranslation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
