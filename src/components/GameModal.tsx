import React from 'react'

interface GameModalProps {
  isVictory: boolean
  score: number
  levelName: string
  hasNextLevel: boolean
  onRestart: () => void
  onNextLevel: () => void
}

const GameModal: React.FC<GameModalProps> = ({
  isVictory,
  score,
  levelName,
  hasNextLevel,
  onRestart,
  onNextLevel
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">
          {isVictory ? '🎉 恭喜过关！' : '😢 挑战失败'}
        </h2>
        <div className="modal-info">
          <p className="modal-text">
            {isVictory ? `太棒了！你成功完成了 ${levelName}！` : `很遗憾，小鸟用完了，再试一次吧！`}
          </p>
          <p className="modal-score">
            得分: <span className="score-value">{score}</span>
          </p>
        </div>
        <div className="modal-actions">
          <button className="modal-btn primary" onClick={onRestart}>
            🔄 重新挑战
          </button>
          {isVictory && hasNextLevel && (
            <button className="modal-btn success" onClick={onNextLevel}>
              ▶ 下一关
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameModal
