import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Share2, Sparkles } from 'lucide-react';

// Функции для правильной работы с Unicode в base64
const encodeBase64 = (str: string): string => {
  const bytes: Uint8Array = new TextEncoder().encode(str);
  const bin: string = String.fromCharCode(...bytes);
  return btoa(bin)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
};

const decodeBase64 = (str: string): string => {
  let base64: string = str
      .replace(/-/g, '+')
      .replace(/_/g, '/');

  // паддинг: длина должна делиться на 4
  const pad = base64.length % 4;
  if (pad) {
    base64 += '='.repeat(4 - pad);
  }

  const bin: string = atob(base64);
  const bytes: Uint8Array = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

interface Question {
  id: number;
  text: string;
  type: 'single' | 'multiple';
  maxAnswers?: number;
}

interface Answers {
  [key: number]: string[];
  custom?: Array<{ question: string; answer: string[] }>;
}

interface AppData {
  userName?: string;
  questions: Question[];
  answers: Answers;
  custom: Array<{ question: string; answer: string[] }>;
}

const QUESTIONS: Question[] = [
  { id: 1, text: 'Саундтрек года', type: 'multiple', maxAnswers: 3 },
  { id: 2, text: 'ТОП фильмов/сериалов года', type: 'multiple', maxAnswers: 3 },
  { id: 3, text: 'Победа года', type: 'single' },
  { id: 4, text: 'Разочарование года', type: 'single' },
  { id: 5, text: 'Занятия года', type: 'multiple', maxAnswers: 3 },
  { id: 6, text: 'Игра/развлечение года', type: 'single' },
  { id: 7, text: 'Поездка или встреча года', type: 'single' },
  { id: 8, text: 'Самая дурацкая покупка года', type: 'single' },
  { id: 9, text: 'Неожиданное событие года', type: 'single' },
  { id: 10, text: 'Открытие года', type: 'single', maxAnswers: 3 },
  { id: 11, text: 'Лучшие моменты года', type: 'multiple' },
  { id: 12, text: 'ТОП желаний в 2026', type: 'single' },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [customQuestions, setCustomQuestions] = useState<Array<{ question: string; answer: string[] }>>([]);
  const [isCustomStep, setIsCustomStep] = useState(false);
  const [customInputCount, setCustomInputCount] = useState(0);
  const [tempCustomQuestion, setTempCustomQuestion] = useState('');
  const [tempCustomAnswer, setTempCustomAnswer] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [direction, setDirection] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewModeQuestions, setViewModeQuestions] = useState<Question[]>(QUESTIONS);
  const [userName, setUserName] = useState<string>('');
  const [showWelcome, setShowWelcome] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');

    if (data) {
      try {
        // data уже декодирована URLSearchParams.get()
        // decodeBase64 сама обработает URL-encoded символы если нужно
        const decoded: AppData = JSON.parse(decodeBase64(data));
        setAnswers(decoded.answers || {});
        setCustomQuestions(decoded.custom || []);
        setUserName(decoded.userName || '');
        setViewMode(true);
        setShowResults(true);
        setShowWelcome(false);
        setIsInitialized(true);
        // В режиме просмотра используем вопросы из данных, если они есть
        // Если вопросов нет (старые ссылки), используем QUESTIONS как fallback
        if (decoded.questions) {
          setViewModeQuestions(decoded.questions);
        } else {
          // Для старых ссылок используем QUESTIONS, но это не идеально
          // соответствует требованию "никакой связи"
          setViewModeQuestions(QUESTIONS);
        }
      } catch (e) {
        console.error('Failed to decode data', e);
        setIsInitialized(true);
      }
    } else {
      const saved = localStorage.getItem('yearReview2025');
      if (saved) {
        try {
          const decoded: AppData = JSON.parse(decodeBase64(saved));
          setAnswers(decoded.answers || {});
          setCustomQuestions(decoded.custom || []);
          setUserName(decoded.userName || '');
          // Используем сохраненные вопросы, если они есть
          // Если вопросов нет (старые сохранения), используем QUESTIONS как fallback
          if (decoded.questions) {
            setViewModeQuestions(decoded.questions);
          } else {
            setViewModeQuestions(QUESTIONS);
          }

          // Проверить, есть ли ответы на вопросы
          const hasAnswers = Object.keys(decoded.answers || {}).length > 0;
          const hasValidAnswers = Object.values(decoded.answers || {}).some(
            answer => answer && answer.length > 0 && !(answer.length === 1 && answer[0] === '-')
          );

          // Если есть имя, но нет ответов - показываем приветственный экран
          if ((decoded.userName && !hasValidAnswers) || !decoded.userName) {
            setShowWelcome(true);
          } else {
            // Найти первый неотвеченный вопрос
            const firstUnanswered = QUESTIONS.findIndex(q => {
              const ans = decoded.answers?.[q.id];
              return !ans || ans.length === 0 || (ans.length === 1 && ans[0] === '-');
            });
            if (firstUnanswered !== -1) {
              setCurrentStep(firstUnanswered);
              setShowWelcome(false);
            } else if (!decoded.custom || decoded.custom.length === 0) {
              setIsCustomStep(true);
              setShowWelcome(false);
            } else {
              setShowResults(true);
              setShowWelcome(false);
            }
          }
        } catch (e) {
          console.error('Failed to load saved data', e);
        }
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    // Сохраняем только если не в режиме просмотра И есть параметр в URL
    const params = new URLSearchParams(window.location.search);
    const hasDataParam = params.has('data');

    if (!viewMode && isInitialized && !hasDataParam) {
      saveToLocalStorage();
    }
  }, [answers, customQuestions, viewMode, isInitialized, userName]);

  const saveToLocalStorage = () => {
    const data: AppData = {
      userName,
      questions: QUESTIONS,
      answers,
      custom: customQuestions,
    };
    const encoded = encodeBase64(JSON.stringify(data));
    localStorage.setItem('yearReview2025', encoded);
  };

  const handleAnswerChange = (questionId: number, value: string, index: number = 0) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      const newAnswers = [...currentAnswers];
      newAnswers[index] = value;
      return { ...prev, [questionId]: newAnswers };
    });
  };

  const handleNext = () => {
    // Проверяем, есть ли хоть один непустой ответ
    const currentQuestion = !isCustomStep ? QUESTIONS[currentStep] : null;
    if (currentQuestion) {
      const currentAnswers = answers[currentQuestion.id] || [];
      const hasAnyAnswer = currentAnswers.some(a => a && a.trim() !== '' && a !== '-');

      // Если нет ответов, записываем "-"
      if (!hasAnyAnswer) {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: ['-'] }));
      }
    }

    if (currentStep < QUESTIONS.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else if (!isCustomStep) {
      setDirection(1);
      setIsCustomStep(true);
    } else {
      setShowResults(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, questionId: number) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  // Проверяем, есть ли хоть один непустой ответ для текущего вопроса
  const hasCurrentAnswer = () => {
    if (isCustomStep) return true;
    const currentQuestion = QUESTIONS[currentStep];
    const currentAnswers = answers[currentQuestion.id] || [];
    return currentAnswers.some(a => a && a.trim() !== '' && a !== '-');
  };

  const handlePrev = () => {
    if (isCustomStep) {
      setDirection(-1);
      setIsCustomStep(false);
    } else if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleAddCustomQuestion = () => {
    if (tempCustomQuestion.trim() && tempCustomAnswer.trim()) {
      setCustomQuestions(prev => [...prev, { question: tempCustomQuestion, answer: [tempCustomAnswer] }]);
      setTempCustomQuestion('');
      setTempCustomAnswer('');
      setCustomInputCount(prev => prev + 1);
    }
  };

  const handleShare = () => {
    const data: AppData = {
      userName,
      questions: QUESTIONS,
      answers,
      custom: customQuestions,
    };
    const encoded = encodeBase64(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
    setShareUrl(url);
    setShowSharePopup(true);

    // Устанавливаем фокус на textarea после открытия попапа
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 100);

    // Попытка копировать с fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(() => {
        // Если не сработало, используем fallback
        fallbackCopyTextToClipboard(url);
      });
    } else {
      // Если Clipboard API недоступен
      fallbackCopyTextToClipboard(url);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Could not copy text', err);
    }
    document.body.removeChild(textArea);
  };

  const handleStartOwn = () => {
    window.location.href = window.location.origin + window.location.pathname;
  };

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setShowWelcome(false);
      saveToLocalStorage();
    }
  };

  const handleKeyPressName = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    }
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Анимированные декоративные элементы */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-10 left-10 text-6xl opacity-30"
        >
          👾
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 right-20 text-6xl opacity-30"
        >
          🎮
        </motion.div>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 left-20 text-6xl opacity-30"
        >
          ⭐
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 right-10 text-6xl opacity-30"
        >
          🎄
        </motion.div>

        <div className="w-full max-w-3xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h1 className="pixel-title text-[#ffd700]">
                ИТОГИ ГОДА 2025
              </h1>

              <p className="pixel-subtitle text-white/80 mt-4">
                Подведите итоги уходящего года и поделитесь ими с друзьями
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <div className="mb-4">
                  <label className="pixel-question text-[#ffd700]">
                    Как вас зовут?
                  </label>
                </div>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="pixel-input w-full bg-[#1a1a3e] text-white border-4 border-[#4a4aff] p-6 focus:border-[#ffd700] outline-none"
                  placeholder="Введите ваше имя..."
                  autoFocus
                  onKeyPress={handleKeyPressName}
                />
              </div>

              <div className="flex justify-center mt-12">
                <button
                  onClick={handleNameSubmit}
                  disabled={!userName.trim()}
                  className="pixel-button bg-[#4a4aff] hover:bg-[#6a6aff] disabled:opacity-30 disabled:cursor-not-allowed text-white px-6 py-4 border-4 border-white transition-all hover:scale-105"
                >
                  Подвести итоги
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white relative overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl opacity-20">👾</div>
          <div className="absolute top-20 right-20 text-6xl opacity-20">🎮</div>
          <div className="absolute bottom-20 left-20 text-6xl opacity-20">⭐</div>
          <div className="absolute bottom-10 right-10 text-6xl opacity-20">🎄</div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4 pixel-title text-[#ffd700]"
          >
            ИТОГИ ГОДА 2025
          </motion.h1>

          {userName && (
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12 pixel-subtitle text-[#4a4aff] text-2xl"
            >
              {userName}
            </motion.h2>
          )}

          <div className="space-y-8">
            {(viewMode ? viewModeQuestions : QUESTIONS).map((question, idx) => {
              const answer = answers[question.id];
              if (!answer || (Array.isArray(answer) && answer.filter(a => a.trim()).length === 0)) return null;

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-[#1a1a3e] border-4 border-[#ffd700] p-6 pixel-border"
                >
                  <h3 className="pixel-question text-[#ffd700] mb-4">🏆 {question.text}</h3>
                  {question.type === 'single' ? (
                    <p className="pixel-answer text-white">{answer[0]}</p>
                  ) : (
                    <ol className="space-y-2">
                      {answer.filter(a => a.trim()).map((ans, i) => (
                        <li key={i} className="pixel-answer text-white">
                          {i + 1}. {ans}
                        </li>
                      ))}
                    </ol>
                  )}
                </motion.div>
              );
            })}

            {customQuestions.map((custom, idx) => (
              <motion.div
                key={`custom-${idx}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ((viewMode ? viewModeQuestions : QUESTIONS).length + idx) * 0.1 }}
                className="bg-[#1a1a3e] border-4 border-[#ff69b4] p-6 pixel-border"
              >
                <h3 className="pixel-question text-[#ff69b4] mb-4">✨ {custom.question}</h3>
                <p className="pixel-answer text-white">{custom.answer[0]}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            {viewMode ? (
              <button
                onClick={handleStartOwn}
                className="pixel-button bg-[#4a4aff] hover:bg-[#6a6aff] text-white px-8 py-4 border-4 border-white transition-all hover:scale-105"
              >
                <Sparkles className="inline mr-2" />
                Подвести свои итоги
              </button>
            ) : (
              <button
                onClick={handleShare}
                className="pixel-button bg-[#4a4aff] hover:bg-[#6a6aff] text-white px-8 py-4 border-4 border-white transition-all hover:scale-105"
              >
                <Share2 className="inline mr-2" />
                Поделиться
              </button>
            )}
          </div>

          {showSharePopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSharePopup(false)}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-[#1a1a3e] border-4 border-[#ffd700] p-8 max-w-lg w-full"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="pixel-question text-[#ffd700] mb-4">Ссылка скопирована! ✓</h3>
                <textarea
                  ref={textareaRef}
                  value={shareUrl}
                  readOnly
                  onFocus={(e) => e.target.select()}
                  className="w-full h-24 bg-[#0a0a1a] text-white border-2 border-white p-3 pixel-answer text-sm resize-none outline-none focus:border-[#ffd700]"
                />
                <button
                  onClick={() => setShowSharePopup(false)}
                  className="pixel-button bg-[#4a4aff] hover:bg-[#6a6aff] text-white px-6 py-3 mt-6 border-2 border-white w-full"
                >
                  Закрыть
                </button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = !isCustomStep ? QUESTIONS[currentStep] : null;

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Анимированные декоративные элементы */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute top-10 left-10 text-6xl opacity-30"
      >
        👾
      </motion.div>
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-20 right-20 text-6xl opacity-30"
      >
        🎮
      </motion.div>
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-20 left-20 text-6xl opacity-30"
      >
        ⭐
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 right-10 text-6xl opacity-30"
      >
        🎄
      </motion.div>

      <div className="w-full max-w-3xl relative z-10">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          {!isCustomStep ? (
            <motion.div
              key={currentStep}
              custom={direction}
              initial={{ opacity: 0, x: direction * 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -100 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="pixel-counter text-[#ffd700] mb-4">
                  {currentStep + 1} / {QUESTIONS.length}
                </div>
                <h2 className="pixel-title text-[#ffd700]">{currentQuestion?.text}</h2>
              </div>

              <div className="space-y-4">
                {currentQuestion?.type === 'single' ? (
                  <input
                    type="text"
                    value={answers[currentQuestion.id]?.[0] || ''}
                    onChange={e => handleAnswerChange(currentQuestion.id, e.target.value, 0)}
                    className="pixel-input w-full bg-[#1a1a3e] text-white border-4 border-[#4a4aff] p-6 focus:border-[#ffd700] outline-none"
                    placeholder="Ваш ответ..."
                    autoFocus
                    onKeyPress={e => handleKeyPress(e, currentQuestion.id)}
                  />
                ) : (
                  <div className="space-y-3">
                    {[0, 1, 2].map(index => (
                      <input
                        key={index}
                        type="text"
                        value={answers[currentQuestion!.id]?.[index] || ''}
                        onChange={e => handleAnswerChange(currentQuestion!.id, e.target.value, index)}
                        className="pixel-input w-full bg-[#1a1a3e] text-white border-4 border-[#4a4aff] p-4 focus:border-[#ffd700] outline-none"
                        placeholder={`${index + 1}. Вариант`}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-12">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="pixel-button bg-[#4a4aff] hover:bg-[#6a6aff] disabled:opacity-30 disabled:cursor-not-allowed text-white px-6 py-4 border-4 border-white transition-all hover:scale-105"
                >
                  <ChevronLeft className="inline" /> Назад
                </button>

                <button
                  onClick={handleNext}
                  className="pixel-button bg-[#4a4aff] hover:bg-[#6a6aff] text-white px-6 py-4 border-4 border-white transition-all hover:scale-105"
                >
                  {hasCurrentAnswer() ? (currentStep === QUESTIONS.length - 1 ? 'Далее >' : 'Дальше >') : 'Пропустить'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="custom"
              custom={direction}
              initial={{ opacity: 0, x: direction * 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -100 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="pixel-title text-[#ff69b4]">
                  Ваши номинации ({customInputCount} / 3)
                </h2>
                <p className="pixel-subtitle text-white/60 mt-4">
                  Добавьте свои уникальные номинации или пропустите
                </p>
              </div>

              {customInputCount < 3 && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={tempCustomQuestion}
                    onChange={e => setTempCustomQuestion(e.target.value)}
                    className="pixel-input w-full bg-[#1a1a3e] text-white border-4 border-[#ff69b4] p-6 focus:border-[#ffd700] outline-none"
                    placeholder="Название номинации..."
                    autoFocus
                  />
                  <input
                    type="text"
                    value={tempCustomAnswer}
                    onChange={e => setTempCustomAnswer(e.target.value)}
                    className="pixel-input w-full bg-[#1a1a3e] text-white border-4 border-[#ff69b4] p-6 focus:border-[#ffd700] outline-none"
                    placeholder="Ваш ответ..."
                    onKeyPress={e => e.key === 'Enter' && handleAddCustomQuestion()}
                  />
                  <button
                    onClick={handleAddCustomQuestion}
                    disabled={!tempCustomQuestion.trim() || !tempCustomAnswer.trim()}
                    className="pixel-button bg-[#ff69b4] hover:bg-[#ff88cc] disabled:opacity-30 disabled:cursor-not-allowed text-white px-6 py-4 border-4 border-white w-full transition-all hover:scale-105"
                  >
                    + Добавить номинацию
                  </button>
                </div>
              )}

              {customQuestions.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="pixel-subtitle text-[#ffd700]">Добавлено:</h3>
                  {customQuestions.map((cq, idx) => (
                    <div key={idx} className="bg-[#1a1a3e] border-2 border-[#ff69b4] p-4">
                      <div className="pixel-answer text-[#ff69b4]">{cq.question}</div>
                      <div className="pixel-answer text-white/80 text-sm mt-1">{cq.answer[0]}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center mt-12">
                <button
                  onClick={handlePrev}
                  className="pixel-button bg-[#4a4aff] hover:bg-[#6a6aff] text-white px-6 py-4 border-4 border-white transition-all hover:scale-105"
                >
                  <ChevronLeft className="inline" /> Назад
                </button>

                <button
                  onClick={() => setShowResults(true)}
                  className="pixel-button bg-[#4a4aff] hover:bg-[#6a6aff] text-white px-6 py-4 border-4 border-white transition-all hover:scale-105"
                >
                  Показать результаты <Sparkles className="inline" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
