import { Loader } from 'lucide-react';

export default function GeneratingStep() {
  return (
    <div className="step-container generating-step">
      <div className="generating-content">
        <div className="spinner">
          <Loader size={64} className="spin" />
        </div>
        <h2>Generating Your PRD</h2>
        <p className="subtitle">AI is analyzing your requirements and creating a comprehensive product specification...</p>
        
        <div className="generating-steps">
          <div className="step-item completed">
            <span className="check">✓</span>
            <span>Analyzed raw input</span>
          </div>
          <div className="step-item completed">
            <span className="check">✓</span>
            <span>Processed discovery answers</span>
          </div>
          <div className="step-item active">
            <span className="dot"></span>
            <span>Writing product overview</span>
          </div>
          <div className="step-item pending">
            <span className="number">4</span>
            <span>Defining user personas</span>
          </div>
          <div className="step-item pending">
            <span className="number">5</span>
            <span>Creating user stories with acceptance criteria</span>
          </div>
        </div>
        
        <p className="tip">This typically takes 30-60 seconds</p>
      </div>
    </div>
  );
}
