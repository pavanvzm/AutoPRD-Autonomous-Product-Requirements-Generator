import { useState } from 'react';
import { useAppStore } from './store';
import InputStep from './components/InputStep';
import DiscoveryStep from './components/DiscoveryStep';
import GeneratingStep from './components/GeneratingStep';
import PRDView from './components/PRDView';

function App() {
  const { currentStep, reset } = useAppStore();
  const [stepIndex, setStepIndex] = useState(0);

  const handleNextStep = () => {
    setStepIndex(prev => prev + 1);
  };

  const handleReset = () => {
    reset();
    setStepIndex(0);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'input':
        return <InputStep onNext={handleNextStep} />;
      case 'discovery':
        return <DiscoveryStep onNext={handleNextStep} />;
      case 'generating':
        return <GeneratingStep />;
      case 'prd':
        return <PRDView onReset={handleReset} />;
      default:
        return <InputStep onNext={handleNextStep} />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1>🚀 AutoPRD</h1>
          <nav>
            <span className={`nav-item ${currentStep === 'input' ? 'active' : ''}`}>Input</span>
            <span className="nav-separator">→</span>
            <span className={`nav-item ${currentStep === 'discovery' ? 'active' : ''}`}>Discovery</span>
            <span className="nav-separator">→</span>
            <span className={`nav-item ${currentStep === 'generating' ? 'active' : ''}`}>Generate</span>
            <span className="nav-separator">→</span>
            <span className={`nav-item ${currentStep === 'prd' ? 'active' : ''}`}>PRD</span>
          </nav>
        </div>
      </header>
      
      <main className="app-main">
        <div className="container">
          {renderStep()}
        </div>
      </main>
      
      <footer className="app-footer">
        <p>AutoPRD - Autonomous Product Requirements Generator © 2026</p>
      </footer>
    </div>
  );
}

export default App;
