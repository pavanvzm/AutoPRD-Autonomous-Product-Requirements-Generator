import { useState } from 'react';
import { useAppStore } from '../store';
import { Sparkles, ArrowRight, MessageSquare, FileText, CheckCircle } from 'lucide-react';

export default function InputStep({ onNext }) {
  const { startDiscovery, loading, error } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rawInput: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.rawInput) return;
    
    try {
      await startDiscovery(formData.title, formData.description, formData.rawInput);
      onNext();
    } catch (err) {
      console.error('Failed to start discovery:', err);
    }
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <div className="icon-wrapper">
          <Sparkles size={32} />
        </div>
        <h1>AutoPRD</h1>
        <p className="subtitle">Autonomous Product Requirements Generator</p>
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <div className="form-group">
          <label htmlFor="title">Product Name *</label>
          <input
            id="title"
            type="text"
            placeholder="e.g., SmartTask AI"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">One-Line Description</label>
          <input
            id="description"
            type="text"
            placeholder="e.g., AI-powered task manager for remote teams"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="rawInput">
            Raw Input *
            <span className="hint">Paste your rough notes, voice memo transcript, competitor URL, or user interview excerpts</span>
          </label>
          <textarea
            id="rawInput"
            placeholder={`Example:
I want to build a task management app that uses AI to automatically prioritize tasks based on deadlines, meeting schedules, and energy levels. 

Key features:
- Auto-prioritization using calendar integration
- Smart scheduling based on user habits
- Team collaboration with AI suggestions

Target users are remote software developers and product managers who struggle with context switching.`}
            value={formData.rawInput}
            onChange={(e) => setFormData({ ...formData, rawInput: e.target.value })}
            rows={8}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading || !formData.title || !formData.rawInput}>
          {loading ? 'Processing...' : 'Start Discovery'}
          {!loading && <ArrowRight size={18} style={{ marginLeft: '8px' }} />}
        </button>
      </form>

      <div className="features-preview">
        <div className="feature-item">
          <MessageSquare size={20} />
          <span>Interactive AI Discovery</span>
        </div>
        <div className="feature-item">
          <FileText size={20} />
          <span>Standardized PRD Templates</span>
        </div>
        <div className="feature-item">
          <CheckCircle size={20} />
          <span>Actionable User Stories</span>
        </div>
      </div>
    </div>
  );
}
