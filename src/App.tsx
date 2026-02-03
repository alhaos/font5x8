import { useState } from "react";
import "./App.css";

type FontData = number[];

function App() {
  const [activeItems, setActiveItems] = useState<Set<number>>(new Set());
  const [fontData, setFontData] = useState<FontData>([0x00, 0x00, 0x00, 0x00, 0x00]);

  // Исправленная функция: бит 0 = верхний пиксель
  const updateFontData = (selectedPixels: Set<number>) => {
    const bytes: number[] = [0, 0, 0, 0, 0]; // 5 колонок

    selectedPixels.forEach(pixelId => {
      // pixelId от 1 до 40
      // Формула: id = row * 5 + col + 1
      const row = Math.floor((pixelId - 1) / 5); // строка 0-7 (0 = верхняя)
      const col = (pixelId - 1) % 5;            // колонка 0-4

      // Устанавливаем бит: row = позиция бита (0 = верхний)
      bytes[col] |= (1 << (7 - row)); // Инвертируем: бит7 = верхний (или 1 << row для бит0 = верхний)
    });

    setFontData(bytes);
  };

  // ИЛИ для бит0 = верхний (более стандартный вариант для дисплеев)
  const updateFontDataBit0Top = (selectedPixels: Set<number>) => {
    const bytes: number[] = [0, 0, 0, 0, 0];

    selectedPixels.forEach(pixelId => {
      const row = Math.floor((pixelId - 1) / 5); // 0-7 (0 = верхний)
      const col = (pixelId - 1) % 5;            // 0-4

      // Бит 0 = верхний пиксель
      // Это стандарт для многих дисплеев
      bytes[col] |= (1 << row);
    });

    setFontData(bytes);
  };

  const handleClick = (id: number) => {
    setActiveItems(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      updateFontDataBit0Top(newSet); // Используем правильную ориентацию
      return newSet;
    });
  };

  // Загрузка данных (проверка ориентации)
  const loadTestPattern = () => {
    // Тестовый паттерн: закрашиваем верхнюю строку
    const testSet = new Set<number>();
    for (let col = 0; col < 5; col++) {
      testSet.add(col + 1); // Верхняя строка: id 1-5
    }
    setActiveItems(testSet);
    updateFontDataBit0Top(testSet);
  };

  const clearAll = () => {
    const emptySet = new Set<number>();
    setActiveItems(emptySet);
    setFontData([0x00, 0x00, 0x00, 0x00, 0x00]);
  };

  const fillAll = () => {
    const allPixels = new Set<number>(Array.from({length: 40}, (_, i) => i + 1));
    setActiveItems(allPixels);
    updateFontDataBit0Top(allPixels);
  };

  // Форматирование в нужный вид
  const getFormattedArray = () => {
    return `{${fontData.map(byte => `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`).join(',')}}`;
  };

  // Копирование в буфер обмена
  const copyToClipboard = () => {
    navigator.clipboard.writeText(getFormattedArray());
  };

  // Визуализация байтов с правильной ориентацией
  const renderByteVisualization = (byte: number, colIndex: number) => {
    const bits = [];
    for (let i = 7; i >= 0; i--) {
      const bitSet = (byte & (1 << i)) !== 0;
      bits.push(
        <div
          key={`col${colIndex}-bit${i}`}
          className={`bit ${bitSet ? 'bit-on' : 'bit-off'}`}
          title={`Бит ${7-i} (${bitSet ? '1' : '0'})`}
        >
          {bitSet ? '1' : '0'}
        </div>
      );
    }
    return bits;
  };

  return (
    <div className="app">
      <h1>Редактор bitmap-шрифтов 5×8</h1>

      <div className="controls">
        <button onClick={clearAll}>Очистить</button>
        <button onClick={fillAll}>Заполнить все</button>
        <button onClick={loadTestPattern}>Тест (верхняя строка)</button>
        <button onClick={copyToClipboard} className="copy-btn">
          Копировать массив
        </button>
      </div>

      <div className="grid-info">
        <div className="grid-label">Колонки →</div>
        <div className="grid-label rows-label">Строки ↓</div>
      </div>

      <div className="container">
        {Array.from({ length: 40 }, (_, i) => {
          const id = i + 1;
          const isActive = activeItems.has(id);
          const row = Math.floor((id - 1) / 5);
          const col = (id - 1) % 5;

          return (
            <div
              key={id}
              className={`item ${isActive ? 'active' : ''}`}
              onClick={() => handleClick(id)}
              title={`Колонка ${col + 1}, Строка ${row + 1}`}
            >
              {/* Показываем координаты */}
              <div className="coords">{col+1},{row+1}</div>
            </div>
          );
        })}
      </div>

      <div className="output-section">
        <h2>Сгенерированные данные:</h2>

        <div className="data-output">
          <div className="array-output">
            <h3>Массив (C/C++ формат):</h3>
            <div className="code-block">
              <code>{getFormattedArray()}</code>
            </div>

            <h3>Варианты объявления:</h3>
            <div className="code-block">
              <code>const uint8_t char[5] = {getFormattedArray()};</code>
            </div>
            <div className="code-block">
              <code>unsigned char font[] = {getFormattedArray()};</code>
            </div>
          </div>

          <div className="bytes-section">
            <h3>Байты по колонкам:</h3>
            <div className="bytes-grid">
              {fontData.map((byte, colIndex) => (
                <div key={colIndex} className="byte-column">
                  <div className="byte-header">Колонка {colIndex + 1}</div>
                  <div className="byte-value">
                    0x{byte.toString(16).padStart(2, '0').toUpperCase()}
                  </div>
                  <div className="byte-bits">
                    {renderByteVisualization(byte, colIndex)}
                  </div>
                  <div className="byte-decimal">({byte})</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="instructions">
        <h3>Как использовать:</h3>
        <ul>
          <li>Кликните на пиксели, чтобы включить/выключить</li>
          <li>Каждая колонка = 1 байт (8 бит)</li>
          <li>Бит 0 = нижний пиксель, Бит 7 = верхний пиксель</li>
          <li>Нажмите "Копировать массив" для вставки в код</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
