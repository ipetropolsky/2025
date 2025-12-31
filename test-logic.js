// Тест логики App.tsx
const testData = {
  questions: [
    { id: 1, text: 'Еда года', type: 'single' },
    { id: 2, text: 'Саундтрек года', type: 'multiple', maxAnswers: 3 },
    { id: 3, text: 'ТОП фильмов/сериалов года', type: 'multiple', maxAnswers: 3 }
  ],
  answers: {
    1: ["werwer"],
    2: ["dsfsd", "sdf", "sdfffff"],
    3: ["yyui", "iuyuy"]
  },
  custom: [
    { question: "234234", answer: ["234234"] }
  ]
};

console.log('Тестируем логику:');
console.log('1. Данные содержат вопросы:', testData.questions.length);
console.log('2. Данные содержат ответы для вопросов:', Object.keys(testData.answers).length);
console.log('3. Данные содержат кастомные вопросы:', testData.custom.length);

// Проверяем, что каждый ответ соответствует вопросу
testData.questions.forEach(q => {
  const answer = testData.answers[q.id];
  console.log(`\nВопрос ${q.id} "${q.text}":`);
  console.log('  Тип:', q.type);
  console.log('  Ответ:', answer ? answer.filter(a => a && a.trim()) : 'нет ответа');
  if (answer) {
    console.log('  Непустые ответы:', answer.filter(a => a && a.trim()).length);
  }
});

// Проверяем логику отображения из App.tsx
console.log('\n=== Проверка логики отображения ===');
const answers = testData.answers;
const questionsToShow = testData.questions;

questionsToShow.forEach((question, idx) => {
  const answer = answers[question.id];
  // Логика из App.tsx строка 283
  if (!answer || (Array.isArray(answer) && answer.filter(a => a.trim()).length === 0)) {
    console.log(`Вопрос ${question.id} "${question.text}" - НЕ показывается (нет ответа)`);
  } else {
    console.log(`Вопрос ${question.id} "${question.text}" - показывается`);
    console.log(`  Ответы: ${answer.filter(a => a.trim()).join(', ')}`);
  }
});

console.log('\n=== Вывод ===');
console.log('Все вопросы с ответами должны отображаться в результатах.');