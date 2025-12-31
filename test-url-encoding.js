// Тест URL encoding/decoding
const testData = {
  questions: [{id: 1, text: 'Test', type: 'single'}],
  answers: {1: ['test']},
  custom: []
};

const json = JSON.stringify(testData);
console.log('Исходный JSON:', json);

// Кодируем как в App.tsx
const encodeBase64 = (str) => {
  const utf8Bytes = new TextEncoder().encode(str);
  let binaryString = '';
  utf8Bytes.forEach(byte => {
    binaryString += String.fromCharCode(byte);
  });
  return btoa(binaryString);
};

const base64 = encodeBase64(json);
console.log('\nBase64:', base64);
console.log('Содержит + ?', base64.includes('+'));
console.log('Содержит / ?', base64.includes('/'));
console.log('Содержит = ?', base64.includes('='));

// URL encoding
const urlEncoded = encodeURIComponent(base64);
console.log('\nURL encoded:', urlEncoded);

// Что возвращает URLSearchParams?
const url = `http://example.com/?data=${urlEncoded}`;
console.log('\nПолный URL:', url);

// Парсим URL
const testUrl = new URL(url);
const params = new URLSearchParams(testUrl.search);
const dataFromParams = params.get('data');
console.log('\nИз URLSearchParams.get():', dataFromParams);
console.log('Сравнение с исходным base64:', dataFromParams === base64);

// Пробуем decodeURIComponent
try {
  const decoded = decodeURIComponent(dataFromParams);
  console.log('\nПосле decodeURIComponent:', decoded);
  console.log('Сравнение с base64:', decoded === base64);
} catch (e) {
  console.log('\nОшибка decodeURIComponent:', e.message);
}

// Тест с реальными данными из примера
console.log('\n=== Тест с реальными данными ===');
const realData = "eyJxdWVzdGlvbnMiOlt7ImlkIjoxLCJ0ZXh0Ijoi0JXQtNCwINCz0L7QtNCwIiwidHlwZSI6InNpbmdsZSJ9LHsiaWQiOjIsInRleHQiOiLQodCw0YPQvdC00YLRgNC10Log0LPQvtC00LAiLCJ0eXBlIjoibXVsdGlwbGUiLCJtYXhBbnN3ZXJzIjozfSx7ImlkIjozLCJ0ZXh0Ijoi0KLQntCfINGE0LjQu9GM0LzQvtCyL9GB0LXRgNC40LDQu9C+0LIg0LPQvtC00LAiLCJ0eXBlIjoibXVsdGlwbGUiLCJtYXhBbnN3ZXJzIjozfV0sImFuc3dlcnMiOnsiMSI6WyJ3ZXJ3ZXIiXSwiMiI6WyJkc2ZzZCIsInNkZiIsInNkZmZmZmYiXSwiMyI6WyJ5eXVpIiwiaXV5dXkiXX0sImN1c3RvbSI6W3sicXVlc3Rpb24iOiIyMzQyMzQiLCJhbnN3ZXIiOlsiMjM0MjM0Il19XX0=";

console.log('Длина данных:', realData.length);
console.log('Содержит + ?', realData.includes('+'));
console.log('Содержит / ?', realData.includes('/'));
console.log('Содержит = ?', realData.includes('='));

// Пробуем atob напрямую
try {
  const decodedReal = atob(realData);
  console.log('\n✓ atob работает с реальными данными');
  console.log('Декодированная длина:', decodedReal.length);
} catch (e) {
  console.log('\n✗ Ошибка atob:', e.message);
}