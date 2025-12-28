export interface ConsultationProps {
    id: string;
    patient_id: string;
    symptoms: string[];
    description: string;
    ai_recommendation: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'completed';
    created_at: string;
    updated_at?: string;
    doctor_notes?: string;
    suggested_specialty?: string;
    follow_up_questions?: string[];
  }