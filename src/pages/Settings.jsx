import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Target, LogOut, User, Minus, Plus, Database } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [dailyGoal, setDailyGoal] = useState(10);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .maybeSingle();

    if (data) {
      setDailyGoal(data.daily_goal || 10);
    }
  };

  const updateGoal = async (newGoal) => {
    const clamped = Math.max(1, Math.min(50, newGoal));
    setDailyGoal(clamped);
    setSaving(true);

    try {
      // Upsert settings
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          { user_id: user.id, daily_goal: clamped },
          { onConflict: 'user_id' }
        );

      if (error) console.error('Settings save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <button className="settings-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="settings-title">설정</h1>
      </div>

      {/* Learning Section */}
      <div className="settings-section" style={{ animationDelay: '0.1s' }}>
        <div className="settings-section-title">학습</div>
        <div className="settings-card glass">
          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-item-icon purple">
                <Target size={18} />
              </div>
              <div>
                <div className="settings-item-label">하루 목표 단어</div>
                <div className="settings-item-desc">
                  매일 외울 단어 수를 설정하세요
                </div>
              </div>
            </div>
            <div className="goal-stepper">
              <button
                className="goal-stepper-btn"
                onClick={() => updateGoal(dailyGoal - 1)}
                disabled={dailyGoal <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="goal-stepper-value">{dailyGoal}</span>
              <button
                className="goal-stepper-btn"
                onClick={() => updateGoal(dailyGoal + 1)}
                disabled={dailyGoal >= 50}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Appearance Section */}
      <div className="settings-section" style={{ animationDelay: '0.15s' }}>
        <div className="settings-section-title">화면</div>
        <div className="settings-card glass">
          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-item-icon blue">
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <div className="settings-item-label">다크 모드</div>
                <div className="settings-item-desc">
                  {theme === 'dark' ? '어두운 테마 사용 중' : '밝은 테마 사용 중'}
                </div>
              </div>
            </div>
            <button
              className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
              onClick={toggleTheme}
              aria-label="다크 모드 토글"
            >
              <div className="toggle-switch-dot" />
            </button>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="settings-section" style={{ animationDelay: '0.2s' }}>
        <div className="settings-section-title">계정</div>
        <div className="settings-card glass">
          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-item-icon purple">
                <User size={18} />
              </div>
              <div>
                <div className="settings-item-label">이메일</div>
                <div className="settings-item-desc">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button className="settings-logout" onClick={handleLogout}>
        <LogOut size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
        로그아웃
      </button>
    </div>
  );
}
