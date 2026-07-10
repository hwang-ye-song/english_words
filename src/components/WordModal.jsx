import { useState, useEffect } from 'react';

export default function WordModal({ isOpen, onClose, onSave, editWord }) {
  const [english, setEnglish] = useState('');
  const [korean, setKorean] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [memoTip, setMemoTip] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editWord) {
      setEnglish(editWord.english || '');
      setKorean(editWord.korean || '');
      setPronunciation(editWord.pronunciation || '');
      setMemoTip(editWord.memo_tip || '');
    } else {
      setEnglish('');
      setKorean('');
      setPronunciation('');
      setMemoTip('');
    }
  }, [editWord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!english.trim() || !korean.trim()) return;

    setSaving(true);
    try {
      await onSave({
        id: editWord?.id,
        english: english.trim(),
        korean: korean.trim(),
        pronunciation: pronunciation.trim() || null,
        memo_tip: memoTip.trim() || null,
      });
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <h2 className="modal-title">
          {editWord ? '단어 수정' : '새 단어 추가'} ✏️
        </h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="word-english">영단어</label>
            <input
              id="word-english"
              type="text"
              className="input-field"
              placeholder="apple"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              required
              autoFocus
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor="word-korean">한국어 뜻</label>
            <input
              id="word-korean"
              type="text"
              className="input-field"
              placeholder="사과"
              value={korean}
              onChange={(e) => setKorean(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor="word-pronunciation">
              발음 나는 대로 적기 <span className="optional">(선택)</span>
            </label>
            <input
              id="word-pronunciation"
              type="text"
              className="input-field"
              placeholder="애플"
              value={pronunciation}
              onChange={(e) => setPronunciation(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor="word-tip">
              나만의 암기 팁 <span className="optional">(선택)</span>
            </label>
            <input
              id="word-tip"
              type="text"
              className="input-field"
              placeholder="빨간 과일 🍎"
              value={memoTip}
              onChange={(e) => setMemoTip(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              취소
            </button>
            <button
              type="submit"
              className="modal-submit"
              disabled={saving || !english.trim() || !korean.trim()}
            >
              {saving ? '저장 중...' : editWord ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
