import { useState } from 'react';
import { useAppStore } from '../store';
import { MessageSquare, ArrowRight, Send } from 'lucide-react';

export default function DiscoveryStep({ onNext }) {
  const { session, submitAnswers, loading, error } = useAppStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');

  const questions = session?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleNext = () => {
    if (!currentQuestion) return;
    
    const updatedAnswers = {
      ...answers,
      [currentQuestion.question_id]: currentAnswer,
    };
    setAnswers(updatedAnswers);
    setCurrentAnswer('');
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit(updatedAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Load previous answer
      const prevQuestion = questions[currentQuestionIndex - 1];
      setCurrentAnswer(answers[prevQuestion.question_id] || '');
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async (finalAnswers) => {
    try {
      await submitAnswers(finalAnswers);
      onNext();
    } catch (err) {
      console.error('Failed to submit answers:', err);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="step-container">
      <div className="step-header">
        <div className="icon-wrapper">
          <MessageSquare size={32} />
        </div>
        <h2>Interactive Discovery</h2>
        <p className="subtitle">Help me understand your product better</p>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        <span className="progress-text">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>

      {currentQuestion && (
        <div className="question-card card">
          <div className="question-category">
            <span className="badge">{currentQuestion.category}</span>
          </div>
          <h3 className="question-text">{currentQuestion.question}</h3>
          
          <div className="answer-section">
            <textarea
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>

          <div className="navigation-buttons">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || loading}
              className="secondary"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!currentAnswer.trim() || loading}
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Generate PRD'}
              <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="questions-overview">
        <h4>Upcoming Questions:</h4>
        <ul>
          {questions.slice(currentQuestionIndex + 1).map((q, idx) => (
            <li key={q.question_id}>
              <span className={`badge ${q.category}`}>{q.category}</span>
              {q.question}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
