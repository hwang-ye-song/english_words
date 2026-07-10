import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedEmail = email.includes('@') ? email : `${email}@voca.app`;

    try {
      if (isLogin) {
        await signIn(formattedEmail, password);
      } else {
        if (password.length < 6) {
          throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
        }
        await signUp(formattedEmail, password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.message;
      if (msg.includes('Invalid login')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('이미 가입된 아이디입니다.');
      } else if (msg.includes('valid email')) {
        setError('올바른 형식으로 입력해 주세요.');
      } else if (msg.includes('6자')) {
        setError(msg);
      } else {
        setError(msg || '오류가 발생했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      <div className="auth-logo">
        <div className="auth-logo-icon">📚</div>
        <h1>VocaFlow</h1>
        <p>매일 조금씩, 단어가 쌓이는 즐거움</p>
      </div>

      <div className="auth-card glass-strong">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            로그인
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            회원가입
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="auth-email">아이디</label>
            <input
              id="auth-email"
              type="text"
              className="input-field"
              placeholder="아이디 입력 (영문, 숫자)"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="auth-password">비밀번호</label>
            <input
              id="auth-password"
              type="password"
              className="input-field"
              placeholder={isLogin ? '비밀번호 입력' : '최소 6자 이상'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
}
