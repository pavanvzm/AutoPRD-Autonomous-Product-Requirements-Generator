import { useAppStore } from '../store';
import { Loader, FileText, Users, Target, CheckCircle, ArrowRight } from 'lucide-react';

export default function PRDView({ onReset }) {
  const { prd, generatePRD, loading } = useAppStore();

  if (!prd) return null;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(prd, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prd.title.replace(/\s+/g, '_')}_PRD.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="step-container prd-view">
      <div className="prd-header">
        <div className="icon-wrapper success">
          <FileText size={32} />
        </div>
        <h2>{prd.title}</h2>
        <p className="subtitle">Product Requirements Document</p>
        
        <div className="prd-actions">
          <button onClick={handleExport}>
            Export JSON
          </button>
          <button onClick={onReset} className="secondary">
            Start New Project
          </button>
        </div>
      </div>

      <div className="prd-content">
        {/* Product Overview */}
        <section className="prd-section card">
          <div className="section-icon">
            <Target size={24} />
          </div>
          <h3 className="section-title">Product Overview</h3>
          <div className="section-content" dangerouslySetInnerHTML={{ __html: prd.product_overview.replace(/\n/g, '<br/>') }} />
        </section>

        {/* User Personas */}
        <section className="prd-section card">
          <div className="section-icon">
            <Users size={24} />
          </div>
          <h3 className="section-title">User Personas</h3>
          <div className="personas-grid">
            {prd.user_personas.map((persona, idx) => (
              <div key={idx} className="persona-card">
                <h4>{persona.name}</h4>
                <p className="persona-role"><strong>Role:</strong> {persona.role}</p>
                <p className="persona-goals"><strong>Goals:</strong> {persona.goals}</p>
                <p className="persona-pain"><strong>Pain Points:</strong> {persona.pain_points}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Constraints */}
        <section className="prd-section card">
          <div className="section-icon">
            <Target size={24} />
          </div>
          <h3 className="section-title">Technical Constraints</h3>
          <ul className="constraints-list">
            {prd.technical_constraints.map((constraint, idx) => (
              <li key={idx}>{constraint}</li>
            ))}
          </ul>
        </section>

        {/* Success Metrics */}
        <section className="prd-section card">
          <div className="section-icon">
            <CheckCircle size={24} />
          </div>
          <h3 className="section-title">Success Metrics</h3>
          <ul className="metrics-list">
            {prd.success_metrics.map((metric, idx) => (
              <li key={idx}>{metric}</li>
            ))}
          </ul>
        </section>

        {/* User Stories */}
        <section className="prd-section card full-width">
          <div className="section-icon">
            <CheckCircle size={24} />
          </div>
          <h3 className="section-title">Actionable Roadmap - User Stories</h3>
          <div className="user-stories">
            {prd.user_stories.map((story) => (
              <div key={story.id} className="user-story-card">
                <div className="story-header">
                  <span className="story-id">{story.id}</span>
                  <h4>{story.title}</h4>
                  <span className={`badge priority-${story.priority}`}>{story.priority}</span>
                </div>
                <p className="story-description">{story.description}</p>
                
                <div className="acceptance-criteria">
                  <h5>Acceptance Criteria (Given/When/Then):</h5>
                  <ul>
                    {story.acceptance_criteria.map((criteria, idx) => (
                      <li key={idx}>{criteria}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
