import { useState } from "react";
import "./App.css";

type FontData = number[]; // Массив из 5 байт (для 5 колонок)

function App() {
  // Состояние для выбранных пикселей
  const [activeItems, setActiveItems] = useState<Set<number>>(new Set());
  // Состояние для данных шрифта (5 байтов)
  const [fontData, setFontData] = useState<FontData>([
    0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  // Функция для преобразования выбранных пикселей в байты
  const updateFontData = (selectedPixels: Set<number>) => {
    const bytes: number[] = [0, 0, 0, 0, 0]; // 5 колонок

    // Преобразуем выбранные пиксели в биты
    selectedPixels.forEach((pixelId) => {
      // pixelId от 1 до 40
      // Формула для вычисления позиции:
      const row = Math.floor((pixelId - 1) / 5); // строка 0-7
      const col = (pixelId - 1) % 5; // колонка 0-4

      // Устанавливаем соответствующий бит
      bytes[col] |= 1 << (7 - row); // Старший бит - верхняя строка
    });

    setFontData(bytes);
  };

  const handleClick = (id: number) => {
    setActiveItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }

      updateFontData(newSet);

      return newSet;
    });
  };

  // Функция для очистки (все пиксели выключены)
  const clearAll = () => {
    const emptySet = new Set<number>();
    setActiveItems(emptySet);
    setFontData([0x00, 0x00, 0x00, 0x00, 0x00]);
  };

  // Функция для заполнения всех пикселей
  const fillAll = () => {
    const allPixels = new Set<number>(
      Array.from({ length: 40 }, (_, i) => i + 1),
    );
    setActiveItems(allPixels);
    updateFontData(allPixels);
  };

  // Функция для отображения байта в HEX и бинарном виде
  const formatByte = (byte: number) => {
    return {
      hex: `0x${byte.toString(16).padStart(2, "0").toUpperCase()}`,
      binary: byte.toString(2).padStart(8, "0"),
    };
  };

  return (
    <div className="app">
      <h1>Bitmap Font Editor 5×8</h1>

      <div className="controls">
        <button onClick={clearAll}>Очистить</button>
        <button onClick={fillAll}>Заполнить все</button>
        <button
          onClick={() =>
            navigator.clipboard.writeText(
              JSON.stringify(
                fontData.map((b) => `0x${b.toString(16).padStart(2, "0")}`),
              ),
            )
          }
        >
          Копировать массив
        </button>
      </div>

      <div className="container">
        {Array.from({ length: 40 }, (_, i) => {
          const id = i + 1;
          const isActive = activeItems.has(id);

          return (
            <div
              key={id}
              className={`item ${isActive ? "active" : ""}`}
              onClick={() => handleClick(id)}
              title={`Пиксель ${id} (Строка: ${Math.floor((id - 1) / 5) + 1}, Колонка: ${((id - 1) % 5) + 1})`}
            >
              {id}
            </div>
          );
        })}
      </div>

      <div className="font-data">
        <h2>Данные шрифта:</h2>

        <div className="bytes-display">
          {fontData.map((byte, index) => {
            const formatted = formatByte(byte);
            return (
              <div key={index} className="byte-item">
                <div className="byte-header">Колонка {index + 1}:</div>
                <div className="byte-value hex">{formatted.hex}</div>
                <div className="byte-value binary">{formatted.binary}</div>
                <div className="byte-decimal">({byte})</div>
              </div>
            );
          })}
        </div>

        <div className="array-output">
          <h3>Массив для кода:</h3>
          <code>
            [
            {fontData
              .map(
                (byte) =>
                  `0x${byte.toString(16).padStart(2, "0").toUpperCase()}`,
              )
              .join(", ")}
            ]
          </code>

          <h3>C/C++ массив:</h3>
          <code>
            {`const uint8_t font_char[5] = {${fontData.map((byte) => `0x${byte.toString(16).padStart(2, "0").toUpperCase()}`).join(", ")}};`}
          </code>
        </div>
      </div>

      {/* Визуализация битов */}
      <div className="bit-visualization">
        <h3>Битовая карта:</h3>
        <div className="bit-grid">
          {[7, 6, 5, 4, 3, 2, 1, 0].map((row) => (
            <div key={row} className="bit-row">
              {fontData.map((byte, col) => (
                <div
                  key={`${col}-${row}`}
                  className={`bit ${byte & (1 << row) ? "bit-on" : "bit-off"}`}
                  title={`Бит ${7 - row} колонки ${col + 1}`}
                >
                  {byte & (1 << row) ? "1" : "0"}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
