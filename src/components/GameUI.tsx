import React from 'react'

interface GameUIProps {
  levelName: string
  remainingBirds: number
  score: number
  power: number
  isDragging: boolean
  onRestart: () => void
  canRestart: boolean
}

const GameUI: React.FC<GameUIProps> = ({
  levelName,
  remainingBirds,
  score,
  power,
  isDragging,
  onRestart,
  canRestart
}) => {
  const getPowerColor = () => {
    if (power < 0.33) return '#4CAF50'
    if (power < 0.66) return '#FFC107'
    return '#F44336'
  }

  return (
    <div className="game-ui">
      <div className="ui-row">
        <div className="info-panel">
          <div className="info-item">
            <span className="label">关卡:</span>
            <span className="value">{levelName}</span>
          </div>
          <div className="info-item">
            <span className="label">分数:</span>
            <span className="value score">{score}</span>
          </div>
        </div>
        <div className="info-panel">
          <div className="info-item">
            <span className="label">剩余小鸟:</span>
            <span className="value birds">{remainingBirds}</span>
          </div>
          <button 
            className="restart-btn"
            onClick={onRestart}
            disabled={!canRestart}
          >
            🔄 重新开始
          </button>
        </div>
      </div>
      
      <div className="ui-row">
        {(isDragging || power > 0) && (
          <div className="power-meter">
            <span className="label">力度:</span>
            <div className="power-bar-container">
              <div 
                className="power-bar"
                style={{
                  width: `${power * 100}%`,
                  backgroundColor: getPowerColor()
                }}
              />
            </div>
            <span className="power-value">{Math.round(power * 100)}%</span>
          </div>
        )}
        
        {!isDragging && remainingBirds > 0 && (
          <div className="hint-panel">
            <span className="hint">💡 拖拽小鸟调整角度和力度，松开发射！</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameUI
