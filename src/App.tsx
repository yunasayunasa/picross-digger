import { useState, useEffect } from 'react';
import './App.css';

// ピクロス/マインスイーパースタイルのゲーム
// プレイヤーはマスをクリックして画像を掘り出す

// プリセット画像パターンを定義 (10x10グリッド)
const PRESET_IMAGES = [
  {
    name: "ハート",
    pattern: [
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,1,1,0,0,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0]
    ]
  },
  {
    name: "スター",
    pattern: [
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0]
    ]
  },
  {
    name: "スマイル",
    pattern: [
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,1,0,0,0,0,1,1,0],
      [1,1,0,0,1,1,0,0,1,1],
      [1,1,0,0,1,1,0,0,1,1],
      [1,1,0,0,0,0,0,0,1,1],
      [0,1,1,0,1,1,0,1,1,0],
      [0,0,1,1,0,0,1,1,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,0,0,0,0,0,0,0,0]
    ]
  }
];

// 難易度レベル設定
const DIFFICULTY_LEVELS = [
  { name: "簡単", revealPercentage: 30 },
  { name: "普通", revealPercentage: 15 },
  { name: "難しい", revealPercentage: 5 }
];

// ゲームの状態を定義
type CellState = {
  revealed: boolean;
  value: number; // 0 = 空, 1 = 画像の一部
};

// プロパティ型定義
type GridProps = {
  grid: CellState[][];
  onCellClick: (row: number, col: number) => void;
  hints: {rows: number[][], cols: number[][]};
};

type GameState = "start" | "selectImage" | "selectDifficulty" | "playing" | "complete";

// ヒントを計算する関数
const calculateHints = (pattern: number[][]) => {
  const rows = pattern.map(row => {
    const hint: number[] = [];
    let count = 0;

    for (let i = 0; i < row.length; i++) {
      if (row[i] === 1) {
        count++;
      } else if (count > 0) {
        hint.push(count);
        count = 0;
      }
    }

    if (count > 0) {
      hint.push(count);
    }

    return hint.length ? hint : [0];
  });

  const cols: number[][] = [];
  for (let col = 0; col < pattern[0].length; col++) {
    const hint: number[] = [];
    let count = 0;

    for (let row = 0; row < pattern.length; row++) {
      if (pattern[row][col] === 1) {
        count++;
      } else if (count > 0) {
        hint.push(count);
        count = 0;
      }
    }

    if (count > 0) {
      hint.push(count);
    }

    cols.push(hint.length ? hint : [0]);
  }

  return { rows, cols };
};

// グリッドを初期化する関数
const initializeGrid = (pattern: number[][], revealPercentage: number): CellState[][] => {
  const grid: CellState[][] = [];
  const totalCells = pattern.length * pattern[0].length;
  const cellsToReveal = Math.floor(totalCells * revealPercentage / 100);

  // 全てのセルを非表示で初期化
  for (let row = 0; row < pattern.length; row++) {
    grid[row] = [];
    for (let col = 0; col < pattern[row].length; col++) {
      grid[row][col] = {
        revealed: false,
        value: pattern[row][col]
      };
    }
  }

  // ランダムにいくつかのセルを表示する
  let revealed = 0;
  while (revealed < cellsToReveal) {
    const row = Math.floor(Math.random() * pattern.length);
    const col = Math.floor(Math.random() * pattern[0].length);

    if (!grid[row][col].revealed) {
      grid[row][col].revealed = true;
      revealed++;
    }
  }

  return grid;
};

// セルコンポーネント
const Cell = ({ revealed, value, onClick }: { revealed: boolean, value: number, onClick: () => void }) => {
  return (
    <div 
      className={`cell ${revealed ? (value === 1 ? 'filled' : 'empty') : 'hidden'}`}
      onClick={onClick}
    >
      {revealed && value === 0 && <span>・</span>}
    </div>
  );
};

// ヒント表示コンポーネント
const Hint = ({ values }: { values: number[] }) => {
  return (
    <div className="hint">
      {values.map((value, index) => (
        <span key={index}>{value}</span>
      ))}
    </div>
  );
};

// グリッドコンポーネント
const Grid = ({ grid, onCellClick, hints }: GridProps) => {
  return (
    <div className="grid-container">
      <div className="top-left-spacer"></div>

      <div className="col-hints">
        {hints.cols.map((hint, col) => (
          <Hint key={col} values={hint} />
        ))}
      </div>

      <div className="row-hints">
        {hints.rows.map((hint, row) => (
          <Hint key={row} values={hint} />
        ))}
      </div>

      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <Cell 
                key={`${rowIndex}-${colIndex}`}
                revealed={cell.revealed}
                value={cell.value}
                onClick={() => onCellClick(rowIndex, colIndex)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// メインアプリケーション
function App() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(0);
  const [grid, setGrid] = useState<CellState[][]>([]);
  const [hints, setHints] = useState<{rows: number[][], cols: number[][]}>({rows: [], cols: []});
  const [moves, setMoves] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [gameComplete, setGameComplete] = useState<boolean>(false);

  // タイマー
  useEffect(() => {
    let timer: number;

    if (gameState === "playing" && !gameComplete) {
      timer = window.setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState, gameComplete]);

  // ゲーム開始
  const startGame = () => {
    const pattern = PRESET_IMAGES[selectedImage].pattern;
    const difficulty = DIFFICULTY_LEVELS[selectedDifficulty];
    const newGrid = initializeGrid(pattern, difficulty.revealPercentage);
    const newHints = calculateHints(pattern);

    setGrid(newGrid);
    setHints(newHints);
    setMoves(0);
    setStartTime(Date.now());
    setCurrentTime(Date.now());
    setGameComplete(false);
    setGameState("playing");
  };

  // セルをクリックした時の処理
  const handleCellClick = (row: number, col: number) => {
    if (gameComplete || grid[row][col].revealed) return;

    const newGrid = [...grid];
    newGrid[row][col] = {
      ...newGrid[row][col],
      revealed: true
    };

    setGrid(newGrid);
    setMoves(moves + 1);

    // ゲームクリアチェック
    checkGameCompletion(newGrid);
  };

  // ヒントを使用する処理
  const useHint = () => {
    // まだ明かされていないセルを探す
    const hiddenCells: {row: number, col: number}[] = [];

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (!grid[row][col].revealed && grid[row][col].value === 1) {
          hiddenCells.push({row, col});
        }
      }
    }

    if (hiddenCells.length > 0) {
      // ランダムに1つのセルを選び、それを明かす
      const randomIndex = Math.floor(Math.random() * hiddenCells.length);
      const {row, col} = hiddenCells[randomIndex];

      const newGrid = [...grid];
      newGrid[row][col] = {
        ...newGrid[row][col],
        revealed: true
      };

      setGrid(newGrid);
      setMoves(moves + 5); // ヒント使用はペナルティとして5手分カウント

      // ゲームクリアチェック
      checkGameCompletion(newGrid);
    }
  };

  // ゲームクリア判定
  const checkGameCompletion = (currentGrid: CellState[][]) => {
    let complete = true;

    for (let row = 0; row < currentGrid.length; row++) {
      for (let col = 0; col < currentGrid[row].length; col++) {
        // 画像の一部であるが、まだ明かされていないセルがある場合
        if (currentGrid[row][col].value === 1 && !currentGrid[row][col].revealed) {
          complete = false;
          break;
        }
      }
      if (!complete) break;
    }

    if (complete) {
      setGameComplete(true);

      // 全てのセルを明かす
      const completedGrid = currentGrid.map(row => 
        row.map(cell => ({
          ...cell,
          revealed: true
        }))
      );

      setGrid(completedGrid);
    }
  };

  // 経過時間の表示用フォーマット
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="App">
      <h1>ピクロス・ディガー</h1>

      {gameState === "start" && (
        <div className="start-screen">
          <h2>画像を発掘しよう！</h2>
          <p>マスを掘り当てて隠された絵を完成させましょう</p>
          <button onClick={() => setGameState("selectImage")}>ゲームスタート</button>
        </div>
      )}

      {gameState === "selectImage" && (
        <div className="selection-screen">
          <h2>画像を選んでください</h2>
          <div className="image-selection">
            {PRESET_IMAGES.map((image, index) => (
              <button 
                key={index} 
                className={selectedImage === index ? "selected" : ""}
                onClick={() => setSelectedImage(index)}
              >
                {image.name}
              </button>
            ))}
          </div>
          <button onClick={() => setGameState("selectDifficulty")}>次へ</button>
        </div>
      )}

      {gameState === "selectDifficulty" && (
        <div className="selection-screen">
          <h2>難易度を選んでください</h2>
          <div className="difficulty-selection">
            {DIFFICULTY_LEVELS.map((difficulty, index) => (
              <button 
                key={index} 
                className={selectedDifficulty === index ? "selected" : ""}
                onClick={() => setSelectedDifficulty(index)}
              >
                {difficulty.name}
              </button>
            ))}
          </div>
          <button onClick={startGame}>ゲームスタート</button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="game-screen">
          <div className="game-info">
            <div>
              <h3>{PRESET_IMAGES[selectedImage].name}</h3>
              <p>難易度: {DIFFICULTY_LEVELS[selectedDifficulty].name}</p>
            </div>
            <div>
              <p>手数: {moves}</p>
              <p>時間: {formatTime(currentTime - startTime)}</p>
            </div>
          </div>

          <Grid grid={grid} onCellClick={handleCellClick} hints={hints} />

          <div className="game-controls">
            <button onClick={useHint}>ヒント (+5手)</button>
            <button onClick={() => setGameState("start")}>タイトルに戻る</button>
          </div>

          {gameComplete && (
            <div className="game-complete">
              <h2>完成!</h2>
              <p>手数: {moves}</p>
              <p>時間: {formatTime(currentTime - startTime)}</p>
              <button onClick={() => setGameState("start")}>もう一度遊ぶ</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;