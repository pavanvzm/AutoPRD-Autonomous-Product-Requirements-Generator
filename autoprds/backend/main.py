from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
import os
import uuid
from datetime import datetime

app = FastAPI(title="AutoPRD API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock database storage
projects_db = {}
discovery_sessions_db = {}
prds_db = {}

# Pydantic Models
class ProjectInput(BaseModel):
    title: str
    description: str
    raw_input: str
    input_type: str = "text"  # text, voice, url, transcript

class DiscoveryQuestion(BaseModel):
    question_id: str
    question: str
    category: str

class DiscoveryResponse(BaseModel):
    project_id: str
    questions: List[DiscoveryQuestion]
    session_id: str

class AnswerInput(BaseModel):
    session_id: str
    answers: Dict[str, str]

class PRDGenerationRequest(BaseModel):
    project_id: str
    session_id: Optional[str] = None

class UserStory(BaseModel):
    id: str
    title: str
    description: str
    acceptance_criteria: List[str]
    priority: str = "medium"

class PRD(BaseModel):
    id: str
    project_id: str
    title: str
    product_overview: str
    user_personas: List[Dict[str, str]]
    technical_constraints: List[str]
    success_metrics: List[str]
    user_stories: List[UserStory]
    created_at: str
    status: str = "draft"

# AI Agent Setup
def get_llm():
    api_key = os.getenv("OPENAI_API_KEY", "sk-mock-key-for-testing")
    return ChatOpenAI(model="gpt-4o-mini", api_key=api_key, temperature=0.7)

# Agent State
class AgentState(Dict):
    pass

# Discovery Agent Prompts
DISCOVERY_PROMPT = """You are an expert Product Manager AI assistant. Your role is to analyze raw product ideas and identify critical missing information.
Given the following product concept: {concept}

Identify 3-5 targeted, clarifying questions that must be answered before writing a comprehensive PRD.
Focus on:
1. Target user pain points
2. Core functionality priorities
3. Technical constraints or preferences
4. Success metrics expectations
5. Competitive landscape

Format your response as a JSON array of objects with keys: 'question_id', 'question', 'category'."""

DRAFTING_PROMPT = """You are an expert Technical Writer AI. Generate a comprehensive PRD based on the following inputs:
Title: {title}
Description: {description}
Discovery Answers: {answers}

Structure the PRD with these mandatory sections:
1. Product Overview (2-3 paragraphs)
2. User Personas (3 distinct personas with name, role, goals, pain points)
3. Technical Constraints (5 specific constraints)
4. Success Metrics (5 measurable KPIs)
5. User Stories (minimum 5 stories in Given/When/Then format)

Return valid JSON matching the PRD schema."""

@app.post("/api/v1/projects/create", response_model=Dict[str, Any])
async def create_project(input_data: ProjectInput):
    """Create a new project from raw input"""
    project_id = str(uuid.uuid4())
    
    projects_db[project_id] = {
        "id": project_id,
        "title": input_data.title,
        "description": input_data.description,
        "raw_input": input_data.raw_input,
        "input_type": input_data.input_type,
        "created_at": datetime.now().isoformat(),
        "status": "discovery_pending"
    }
    
    return {"project_id": project_id, "status": "created"}

@app.post("/api/v1/discovery/start", response_model=DiscoveryResponse)
async def start_discovery(input_data: ProjectInput):
    """Start interactive discovery session - AI generates clarifying questions"""
    project_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    
    llm = get_llm()
    
    try:
        # In production, this would call the actual LLM
        # For demo, we'll simulate intelligent questions
        concept = f"{input_data.title}: {input_data.description}\n\nRaw Input: {input_data.raw_input}"
        
        # Simulated discovery questions (replace with actual LLM call in production)
        questions = [
            {
                "question_id": "q1",
                "question": "Who is the primary target user for this product, and what is their biggest pain point that this solves?",
                "category": "user_persona"
            },
            {
                "question_id": "q2", 
                "question": "What are the top 3 core features that must be included in the MVP (Minimum Viable Product)?",
                "category": "features"
            },
            {
                "question_id": "q3",
                "question": "Are there any specific technical constraints, preferred tech stack, or integration requirements we should know about?",
                "category": "technical"
            },
            {
                "question_id": "q4",
                "question": "How will you measure success? What are the key metrics (e.g., user acquisition, retention, revenue) for the first 6 months?",
                "category": "metrics"
            },
            {
                "question_id": "q5",
                "question": "Who are the main competitors, and what differentiates your solution from theirs?",
                "category": "market"
            }
        ]
        
        discovery_sessions_db[session_id] = {
            "session_id": session_id,
            "project_id": project_id,
            "questions": questions,
            "answers": {},
            "status": "pending_answers",
            "created_at": datetime.now().isoformat()
        }
        
        projects_db[project_id] = {
            "id": project_id,
            "title": input_data.title,
            "description": input_data.description,
            "raw_input": input_data.raw_input,
            "input_type": input_data.input_type,
            "discovery_session_id": session_id,
            "created_at": datetime.now().isoformat(),
            "status": "in_discovery"
        }
        
        return DiscoveryResponse(
            project_id=project_id,
            questions=[DiscoveryQuestion(**q) for q in questions],
            session_id=session_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discovery failed: {str(e)}")

@app.post("/api/v1/discovery/answer", response_model=Dict[str, Any])
async def submit_answers(answer_input: AnswerInput):
    """Submit answers to discovery questions"""
    session_id = answer_input.session_id
    
    if session_id not in discovery_sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = discovery_sessions_db[session_id]
    session["answers"] = answer_input.answers
    session["status"] = "completed"
    
    project_id = session["project_id"]
    if project_id in projects_db:
        projects_db[project_id]["status"] = "ready_for_generation"
    
    return {"status": "success", "message": "Answers recorded", "next_step": "generate_prd"}

@app.post("/api/v1/prd/generate")
async def generate_prd(request: PRDGenerationRequest, background_tasks: BackgroundTasks):
    """Generate complete PRD with user stories (async)"""
    project_id = request.project_id
    session_id = request.session_id
    
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects_db[project_id]
    
    # Gather context
    answers = {}
    if session_id and session_id in discovery_sessions_db:
        answers = discovery_sessions_db[session_id].get("answers", {})
    
    prd_id = str(uuid.uuid4())
    
    # Create placeholder PRD
    prd_record = {
        "id": prd_id,
        "project_id": project_id,
        "title": project["title"],
        "product_overview": "Generating...",
        "user_personas": [],
        "technical_constraints": [],
        "success_metrics": [],
        "user_stories": [],
        "created_at": datetime.now().isoformat(),
        "status": "generating"
    }
    
    prds_db[prd_id] = prd_record
    projects_db[project_id]["current_prd_id"] = prd_id
    
    # Background task to generate PRD
    async def generate_prd_background():
        try:
            llm = get_llm()
            
            # Format context for LLM
            context = {
                "title": project["title"],
                "description": project["description"],
                "raw_input": project["raw_input"],
                "answers": answers
            }
            
            # Simulated PRD generation (replace with actual LangGraph workflow in production)
            generated_prd = {
                "id": prd_id,
                "project_id": project_id,
                "title": project["title"],
                "product_overview": f"**Product Vision**: {project['title']} is designed to address the core needs identified in the discovery phase. {project['description']}\n\n**Problem Statement**: Based on your input, the primary problem being solved is the inefficiency in current solutions. This product will streamline workflows and provide actionable insights.\n\n**Solution Overview**: The platform leverages AI to autonomously generate requirements, reducing time-to-market by 60%.",
                
                "user_personas": [
                    {"name": "Sarah the Solo Founder", "role": "Entrepreneur", "goals": "Validate idea quickly without hiring PM", "pain_points": "Overwhelmed by documentation, lacks technical specs"},
                    {"name": "Mike the Product Manager", "role": "PM at Startup", "goals": "Standardize PRD process across teams", "pain_points": "Inconsistent requirements, scope creep"},
                    {"name": "Alex the Engineering Lead", "role": "CTO/Tech Lead", "goals": "Clear specs to estimate and build efficiently", "pain_points": "Ambiguous requirements, missing acceptance criteria"}
                ],
                
                "technical_constraints": [
                    "Must support 10,000+ concurrent users within 6 months",
                    "API response time < 200ms for all endpoints",
                    "GDPR and SOC2 compliance required",
                    "Mobile-first responsive design",
                    "Integration with Slack, Jira, and Linear within Q1"
                ],
                
                "success_metrics": [
                    "Achieve 1,000 active users within first 3 months",
                    "Reduce PRD creation time from 8 hours to 30 minutes",
                    "90% user satisfaction score (NPS > 50)",
                    "50% week-over-week retention rate",
                    "Generate $10K MRR within 6 months"
                ],
                
                "user_stories": [
                    {
                        "id": "us1",
                        "title": "User submits raw idea via text",
                        "description": "As a founder, I want to paste my rough notes so that the AI can understand my concept",
                        "acceptance_criteria": [
                            "Given I have rough text notes, when I paste them into the input box, then the system accepts any length up to 5000 characters",
                            "Given I submit text, when the system processes it, then it identifies key themes and entities",
                            "Given the text is processed, when discovery starts, then relevant questions are generated"
                        ],
                        "priority": "high"
                    },
                    {
                        "id": "us2",
                        "title": "AI asks clarifying questions",
                        "description": "As a user, I want targeted questions so that gaps in my idea are filled before drafting",
                        "acceptance_criteria": [
                            "Given a raw idea is submitted, when discovery starts, then 3-5 contextual questions appear",
                            "Given I answer a question, when I submit, then the next question loads smoothly",
                            "Given all questions are answered, when complete, then the generate button becomes active"
                        ],
                        "priority": "high"
                    },
                    {
                        "id": "us3",
                        "title": "Generate standardized PRD",
                        "description": "As a PM, I want a structured PRD with all mandatory sections so that engineering has clear specs",
                        "acceptance_criteria": [
                            "Given discovery is complete, when I click generate, then a PRD with all 4 mandatory sections is created",
                            "Given the PRD is generated, when I view it, then each section is clearly labeled and formatted",
                            "Given the draft exists, when I edit, then changes are saved as new versions"
                        ],
                        "priority": "high"
                    },
                    {
                        "id": "us4",
                        "title": "Export user stories with acceptance criteria",
                        "description": "As an eng lead, I want exportable user stories in Given/When/Then format so my team can start building",
                        "acceptance_criteria": [
                            "Given a PRD exists, when I navigate to roadmap, then at least 5 user stories are displayed",
                            "Given a user story, when I expand it, then 3+ acceptance criteria in Given/When/Then format are shown",
                            "Given stories are ready, when I click export, then a JSON/CSV file downloads"
                        ],
                        "priority": "medium"
                    },
                    {
                        "id": "us5",
                        "title": "Iterate on PRD with AI feedback",
                        "description": "As a user, I want to refine the PRD through conversation so that it perfectly matches my vision",
                        "acceptance_criteria": [
                            "Given a draft PRD, when I request changes via chat, then the AI updates specific sections",
                            "Given multiple versions exist, when I compare, then a diff view highlights changes",
                            "Given I'm satisfied, when I finalize, then the PRD is locked and ready for export"
                        ],
                        "priority": "medium"
                    }
                ],
                
                "created_at": datetime.now().isoformat(),
                "status": "completed"
            }
            
            prds_db[prd_id] = generated_prd
            projects_db[project_id]["status"] = "completed"
            projects_db[project_id]["current_prd_id"] = prd_id
            
        except Exception as e:
            prds_db[prd_id]["status"] = "failed"
            print(f"PRD generation failed: {e}")
    
    background_tasks.add_task(generate_prd_background)
    
    return {"prd_id": prd_id, "status": "generating", "message": "PRD generation started in background"}

@app.get("/api/v1/prd/{prd_id}", response_model=PRD)
async def get_prd(prd_id: str):
    """Retrieve generated PRD"""
    if prd_id not in prds_db:
        raise HTTPException(status_code=404, detail="PRD not found")
    
    prd_data = prds_db[prd_id]
    return PRD(**prd_data)

@app.get("/api/v1/prd/{prd_id}/roadmap")
async def get_roadmap(prd_id: str):
    """Get actionable roadmap with user stories"""
    if prd_id not in prds_db:
        raise HTTPException(status_code=404, detail="PRD not found")
    
    prd = prds_db[prd_id]
    return {
        "prd_id": prd_id,
        "title": prd["title"],
        "user_stories": prd["user_stories"],
        "total_stories": len(prd["user_stories"]),
        "estimated_velocity": "5 stories per sprint"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AutoPRD API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
