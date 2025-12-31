// Тест функции decodeBase64
const testData = "eyJxdWVzdGlvbnMiOlt7ImlkIjoxLCJ0ZXh0Ijoi0JXQtNCwINCz0L7QtNCwIiwidHlwZSI6InNpbmdsZSJ9LHsiaWQiOjIsInRleHQiOiLQodCw0YPQvdC00YLRgNC10Log0LPQvtC00LAiLCJ0eXBlIjoibXVsdGlwbGUiLCJtYXhBbnN3ZXJzIjozfSx7ImlkIjozLCJ0ZXh0Ijoi0KLQntCfINGE0LjQu9GM0LzQvtCyL9GB0LXRgNC40LDQu9C+0LIg0LPQvtC00LAiLCJ0eXBlIjoibXVsdGlwbGUiLCJtYXhBbnN3ZXJzIjozfV0sImFuc3dlcnMiOnsiMSI6WyJ3ZXJ3ZXIiXSwiMiI6WyJkc2ZzZCIsInNkZiIsInNkZmZmZmYiXSwiMyI6WyJ5eXVpIiwiaXV5dXkiXX0sImN1c3RvbSI6W3sicXVlc3Rpb24iOiIyMzQyMzQiLCJhbnN3ZXIiOlsiMjM0MjM0Il19XX0=";

// Имитация функции decodeBase64 из App.tsx
function decodeBase64(str) {
  try {
    // Сначала пытаемся декодировать как есть
    let bin;
    try {
      bin = atob(str);
    } catch (e) {
      // Если atob не работает, возможно строка содержит URL-encoded символы
      // Пробуем decodeURIComponent
      const decoded = decodeURIComponent(str);
      bin = atob(decoded);
    }

    const length = bin.length;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }

    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.error('Base64 decoding error:', e);
    throw new Error(`Failed to decode base64: ${e.message}`);
  }
}

// Тест 1: Прямой вызов atob
console.log('Тест 1: Прямой atob');
try {
  const result1 = atob(testData);
  console.log('✓ atob успешен, длина:', result1.length);
} catch (e) {
  console.log('✗ atob ошибка:', e.message);
}

// Тест 2: Наша функция decodeBase64
console.log('\nТест 2: decodeBase64');
try {
  const result2 = decodeBase64(testData);
  console.log('✓ decodeBase64 успешен, длина:', result2.length);

  // Парсим JSON
  const parsed = JSON.parse(result2);
  console.log('✓ JSON парсинг успешен');
  console.log('  Вопросов:', parsed.questions.length);
  console.log('  Ответов:', Object.keys(parsed.answers).length);
  console.log('  Кастомных вопросов:', parsed.custom.length);
} catch (e) {
  console.log('✗ Ошибка:', e.message);
}

// Тест 3: URL-encoded версия (как может прийти в URL)
console.log('\nТест 3: URL-encoded данные');
const urlEncoded = encodeURIComponent(testData);
console.log('URL-encoded длина:', urlEncoded.length);
console.log('Содержит % ?', urlEncoded.includes('%'));

try {
  const result3 = decodeBase64(urlEncoded);
  console.log('✓ decodeBase64 с URL-encoded данными успешен');
} catch (e) {
  console.log('✗ Ошибка с URL-encoded:', e.message);
}

// Тест 4: Что возвращает URLSearchParams?
console.log('\nТест 4: Имитация URLSearchParams');
const url = `http://example.com/?data=${urlEncoded}`;
const testUrl = new URL(url);
const params = new URLSearchParams(testUrl.search);
const fromParams = params.get('data');
console.log('Из URLSearchParams.get():', fromParams ? 'получено' : 'null');
console.log('Длина:', fromParams?.length);
console.log('Сравнение с исходным:', fromParams === testData);

if (fromParams) {
  try {
    const result4 = decodeBase64(fromParams);
    console.log('✓ decodeBase64 с данными из URLSearchParams успешен');
  } catch (e) {
    console.log('✗ Ошибка:', e.message);
  }
}