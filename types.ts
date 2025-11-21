export interface Dataset {
  name: string;
  url: string;
  source: 'Hugging Face' | 'Kaggle' | 'Other';
  description: string;
}

export interface ProjectBlueprint {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  domain: string;
  paper: {
    title: string;
    url?: string; 
    authors?: string;
  };
  huggingFaceModel: {
    modelId: string;
    task: string;
  };
  datasets: Dataset[];
  implementationSteps: string[];
  techStack: string[];
  pythonSnippet: string;
}

export interface GeminiResponseWrapper {
  projects: ProjectBlueprint[];
}

export type ViewState = 'LANDING' | 'LOADING' | 'RESULTS' | 'DETAIL';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}