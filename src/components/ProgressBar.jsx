import { Target } from 'lucide-react';

export default function ProgressBar({ current, goal }) {
  const percentage = Math.min((current / goal) * 100, 100);
  const isComplete = current >= goal;

  const getMessage = () => {
    if (isComplete) return '🎉 오늘 목표 달성! 대단해요!';
    if (percentage >= 70) return '거의 다 왔어요! 조금만 더 💪';
    if (percentage >= 40) return '좋은 페이스예요! 계속 가요 🔥';
    if (percentage > 0) return '좋은 시작이에요! 화이팅 ✨';
    return '오늘의 단어 학습을 시작해 볼까요?';
  };

  return (
    <div className="progress-section">
      <div className="progress-card glass">
        <div className="progress-header">
          <span className="progress-title">
            <Target size={14} />
            오늘의 목표
          </span>
          <span className={`progress-count ${isComplete ? 'complete' : ''}`}>
            {current} / {goal}
          </span>
        </div>

        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${isComplete ? 'complete' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className={`progress-message ${isComplete ? 'complete' : ''}`}>
          {getMessage()}
        </p>
      </div>
    </div>
  );
}
