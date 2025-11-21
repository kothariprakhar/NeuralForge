import { GoogleGenAI } from "@google/genai";
import { ProjectBlueprint } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in process.env");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMLProjects = async (topic: string): Promise<{ projects: ProjectBlueprint[], groundingMetadata: any }> => {
  const ai = getClient();

  const prompt = `
    Act as a Senior Machine Learning Engineer and Researcher.
    The user is interested in: "${topic}".
    
    Your goal is to suggest 3 distinct, high-value, and interesting project ideas that the user can build.
    These projects should leverage actual, existing models on Hugging Face and relate to real research papers.
    
    For each project, provide:
    1. A catchy Title.
    2. A concise Description.
    3. Difficulty level (Beginner, Intermediate, Advanced).
    4. The specific ML Domain (e.g., NLP, CV, RL, Audio).
    5. The name of a key Research Paper related to the technique (approximate title is fine, I will search for it).
    6. A specific, existing Hugging Face Model ID that is relevant (e.g., "stabilityai/stable-diffusion-3-medium" or "meta-llama/Meta-Llama-3-8B").
    7. 4-5 high-level Implementation Steps.
    8. Recommended Tech Stack (libraries like PyTorch, Transformers, Diffusers, Gradio, etc.).
    9. A short, valid Python code snippet using the 'transformers', 'diffusers' or 'torch' library to initialize the model or pipeline.
    10. Suggest 2 relevant datasets from Hugging Face Datasets or Kaggle that would be perfect for training, fine-tuning, or testing this specific project. Provide the Name, Source (Hugging Face or Kaggle), and a very brief Description.
    
    Format the output as a purely JSON object with a key "projects" containing an array of objects.
    The dataset objects should look like { "name": "...", "url": "...", "source": "...", "description": "..." }. If you know the specific URL, provide it, otherwise leave it empty.
    
    Do not use markdown formatting for the JSON block (no \`\`\`json). Just return the raw JSON string if possible, or ensure the JSON is easy to extract.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using 2.5 Flash for speed and efficiency
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable grounding to find real models and papers
        temperature: 0.7,
      },
    });

    const text = response.text;
    
    // Robust JSON extraction
    let cleanJson = text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      cleanJson = jsonMatch[1];
    }

    // Clean up any remaining non-JSON artifacts if necessary
    cleanJson = cleanJson.trim();

    const parsed = JSON.parse(cleanJson);
    
    // Add IDs if missing
    const projectsWithIds = parsed.projects.map((p: any, index: number) => ({
      ...p,
      id: `proj_${Date.now()}_${index}`,
      // Normalize fields if the LLM varied keys slightly
      huggingFaceModel: p.huggingFaceModel || { modelId: "unknown", task: "unknown" },
      paper: p.paper || { title: "Unknown Paper" },
      implementationSteps: p.implementationSteps || [],
      pythonSnippet: p.pythonSnippet || "# No code provided",
      techStack: p.techStack || [],
      datasets: p.datasets || []
    }));

    return {
      projects: projectsWithIds,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate project ideas. Please try again.");
  }
};