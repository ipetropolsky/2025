// Тест для проверки логики обработки данных
const encodeBase64 = (str) => {
  const utf8Bytes = new TextEncoder().encode(str);
  let binaryString = '';
  utf8Bytes.forEach(byte => {
    binaryString += String.fromCharCode(byte);
  });
  return btoa(binaryString);
};

const decodeBase64 = (str) => {
  const binaryString = atob(str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

// Тест 1: Проверка структуры данных для новой ссылки
const newData = {
  questions: [
    { id: 1, text: 'Еда года', type: 'single' },
    { id: 2, text: 'Саундтрек года', type: 'multiple', maxAnswers: 3 },
    { id: 3, text: 'ТОП фильмов/сериалов года', type: 'multiple', maxAnswers: 3 }
  ],
  answers: {
    1: ['Пицца'],
    2: ['Песня 1', 'Песня 2', 'Песня 3'],
    3: ['Фильм 1', 'Фильм 2']
  },
  custom: [
    { question: 'Моя номинация', answer: ['Мой ответ'] }
  ]
};

const encodedNew = encodeBase64(JSON.stringify(newData));
console.log('Новая ссылка (с вопросами):');
console.log('http://localhost:3000/?data=' + encodeURIComponent(encodedNew));
console.log('Длина данных:', encodedNew.length);

// Тест 2: Проверка обратной совместимости (старые ссылки)
const oldData = {
  answers: {
    1: ['Пицца'],
    2: ['Песня 1', 'Песня 2', 'Песня 3'],
    3: ['Фильм 1', 'Фильм 2']
  },
  custom: [
    { question: 'Моя номинация', answer: ['Мой ответ'] }
  ]
};

const encodedOld = encodeBase64(JSON.stringify(oldData));
console.log('\nСтарая ссылка (без вопросов):');
console.log('http://localhost:3000/?data=' + encodeURIComponent(encodedOld));
console.log('Длина данных:', encodedOld.length);

// Тест 3: Декодирование примера из ТЗ
const exampleData = 'eyJhbnN3ZXJzIjp7IjEiOlsi0YvQstCw0L/Ri9CyIl0sIjIiOlsi0YvQstCwIiwi0YvQstCwMiIsItGL0LLQsDUiXSwiMyI6WyIzMyIsIjMiXX0sImN1c3RvbSI6W3sicXVlc3Rpb24iOiLQv9GA0L/RgNC+IiwiYW5zd2VyIjpbItGL0LLQsNGL0LLQsCJdfV19';
try {
  const decodedExample = JSON.parse(decodeBase64(exampleData));
  console.log('\nПример из ТЗ:');
  console.log('Успешно декодирован');
  console.log('Есть вопросы?', !!decodedExample.questions);
  console.log('Количество ответов:', Object.keys(decodedExample.answers || {}).length);
  console.log('Количество кастомных вопросов:', (decodedExample.custom || []).length);
} catch (e) {
  console.log('\nОшибка декодирования примера из ТЗ:', e.message);
}

console.log('\n=== РЕЗЮМЕ ===');
console.log('1. Новые ссылки содержат вопросы, ответы и кастомные вопросы');
console.log('2. Старые ссылки содержат только ответы и кастомные вопросы');
console.log('3. Код должен обрабатывать оба случая');
console.log('4. В режиме просмотра используются вопросы из данных (или QUESTIONS как fallback)');