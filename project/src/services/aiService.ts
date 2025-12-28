import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(import.meta.env.VITE_HUGGINGFACE_API_KEY);

interface SymptomAnalysis {
    priority: 'urgent' | 'high' | 'medium' | 'low';
    recommendation: string;
    specialty: string;
    followUpQuestions: string[];
  }
  
  class AIService {
    private apiKey: string;
    private apiUrl = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
  
    constructor(apiKey: string) {
      this.apiKey = apiKey;
    }
  
    async analyzeSymptoms(
      symptoms: string[],
      description: string
    ): Promise<SymptomAnalysis> {
      try {
        const prompt = this.buildPrompt(symptoms, description);
        const response = await this.callAIModel(prompt);

        console.log(9123, response)
        return this.parseResponse(response?.content || "");
      } catch (error) {
        console.error('AI analysis failed:', error);
        return this.getFallbackAnalysis(symptoms, description);
      }
    }
  
    
    private buildPrompt(symptoms: string[], description: string): string {
      return `You are a medical AI assistant helping to triage patient symptoms. Analyze the following and respond in JSON format.
  
  Symptoms: ${symptoms.join(', ')}
  Description: ${description}
  
  Provide a JSON response with:
  {
    "priority": "urgent|high|medium|low",
    "recommendation": "2-3 sentences of medical advice",
    "specialty": "recommended medical specialty",
    "followUpQuestions": ["5-7 relevant questions for the doctor"]
  }
  
  Priority levels:
  - urgent: Life-threatening, needs immediate ER (chest pain, severe bleeding, loss of consciousness)
  - high: Serious but not immediately life-threatening (high fever, severe pain, difficulty breathing)
  - medium: Moderate symptoms needing attention within days (persistent headache, mild fever)
  - low: Minor symptoms (single mild symptom, general discomfort)
  
  Respond ONLY with valid JSON, no other text.`;
    }
  
    
    private async callAIModel(prompt: string) {
        const chatCompletion = await client.chatCompletion({
            model: "meta-llama/Llama-3.1-8B-Instruct:sambanova",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        
        console.log(chatCompletion.choices[0].message);

       const response = chatCompletion.choices[0].message

        return response
    }
  
    
    private parseResponse(response: string): SymptomAnalysis {
      try {
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);
  
        return {
          priority: parsed.priority || 'medium',
          recommendation: parsed.recommendation || 'Please consult with a healthcare provider.',
          specialty: parsed.specialty || 'General Practitioner',
          followUpQuestions: parsed.followUpQuestions || [],
        };
      } catch (error) {
        console.error('Failed to parse AI response:', error);
        throw error;
      }
    }
  
    
    private getFallbackAnalysis(symptoms: string[], description: string): SymptomAnalysis {
      // Critical symptoms
      const critical = [
        'chest pain',
        'severe bleeding',
        'unconscious',
        'not breathing',
        'seizure',
        'stroke',
      ];
  
      // High priority symptoms
      const highPriority = [
        'fever',
        'difficulty breathing',
        'severe pain',
        'vomiting',
        'dehydration',
      ];
  
      const symptomsLower = symptoms.map((s) => s.toLowerCase());
      const descLower = description.toLowerCase();
  
      if (
        critical.some(
          (c) =>
            symptomsLower.some((s) => s.includes(c)) || descLower.includes(c)
        )
      ) {
        return {
          priority: 'urgent',
          recommendation:
            'Seek immediate emergency medical attention. Call emergency services or go to the nearest emergency room immediately.',
          specialty: 'Emergency Medicine',
          followUpQuestions: [
            'When did these symptoms start?',
            'Have you experienced this before?',
            'Are you taking any medications?',
          ],
        };
      }
  
      if (
        highPriority.some(
          (h) =>
            symptomsLower.some((s) => s.includes(h)) || descLower.includes(h)
        )
      ) {
        return {
          priority: 'high',
          recommendation:
            'Please consult with a healthcare provider within 24 hours. Your symptoms require medical attention.',
          specialty: 'General Practitioner',
          followUpQuestions: [
            'When did these symptoms begin?',
            'Have you taken any medication?',
            'Do you have any chronic conditions?',
          ],
        };
      }
  
      return {
        priority: 'medium',
        recommendation:
          'Please schedule an appointment with a healthcare provider within the next few days to discuss your symptoms.',
        specialty: 'General Practitioner',
        followUpQuestions: [
          'How long have you had these symptoms?',
          'Have the symptoms gotten worse?',
          'Are you experiencing any other issues?',
        ],
      };
    }
  }
  
  let aiServiceInstance: AIService | null = null;
  
  export const getAIService = (apiKey?: string): AIService => {
    if (!aiServiceInstance) {
      const key = apiKey || import.meta.env.VITE_HUGGINGFACE_API_KEY;
      if (!key) {
        throw new Error(
          'HUGGINGFACE API key not found. Set VITE_HUGGINGFACE_API_KEY in .env'
        );
      }
      aiServiceInstance = new AIService(key);
    }
    return aiServiceInstance;
  };
  
  export default AIService;