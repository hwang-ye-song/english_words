import { useState, useEffect } from 'react';
import { PenLine, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function DailyNote() {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [noteId, setNoteId] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    loadTodayNote();
  }, [user]);

  const loadTodayNote = async () => {
    const { data, error } = await supabase
      .from('daily_notes')
      .select('*')
      .eq('note_date', today)
      .maybeSingle();

    if (!error && data) {
      setContent(data.content);
      setSavedContent(data.content);
      setNoteId(data.id);
    }
  };

  const handleSave = async () => {
    if (!content.trim() || content === savedContent) return;
    setSaving(true);

    try {
      if (noteId) {
        await supabase
          .from('daily_notes')
          .update({ content: content.trim() })
          .eq('id', noteId);
      } else {
        const { data } = await supabase
          .from('daily_notes')
          .insert({ content: content.trim(), note_date: today })
          .select()
          .single();

        if (data) setNoteId(data.id);
      }

      setSavedContent(content.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Note save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const hasChanged = content.trim() !== savedContent;

  return (
    <div className="daily-note-section">
      <div className="daily-note-header">
        <span className="daily-note-title">
          <PenLine size={14} />
          오늘의 한 줄 메모
        </span>
        {saved && (
          <span className="daily-note-saved">
            <Check size={14} /> 저장됨
          </span>
        )}
      </div>

      <div className="daily-note-card glass">
        <textarea
          className="daily-note-input"
          placeholder="배운 단어로 짧은 문장을 적어보세요 ✍️"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
        />
        {hasChanged && (
          <div className="daily-note-actions">
            <button
              className="daily-note-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
