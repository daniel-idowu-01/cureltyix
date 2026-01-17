import { useState, useEffect } from 'react';
import { supabase, Symptom } from '../lib/supabase';
import { Button } from './Button';
import { X, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { getAIService } from '../services/aiService';
import toast from 'react-hot-toast';

interface NewConsultationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewConsultationModal({ onClose, onSuccess }: NewConsultationModalProps) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    loadSymptoms();

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const loadSymptoms = async () => {
    try {
      const { data } = await supabase
        .from('symptoms')
        .select('*')
        .order('category', { ascending: true });
      setSymptoms(data || []);
    } catch (error) {
      console.error('Error loading symptoms:', error);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const analyzeWithAI = async () => {
    if (selectedSymptoms.length === 0 || !description.trim()) {
      toast.error('Please select symptoms and provide a description');
      return;
    }

    setAnalyzing(true);
    try {
      const aiService = getAIService();
      const analysis = await aiService.analyzeSymptoms(selectedSymptoms, description);
      setAiAnalysis(analysis);
      toast.success('AI analysis complete!');
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast.error('AI analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!aiAnalysis) {
      toast.error('Please analyze symptoms with AI first');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login first');
        return;
      }

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!patientData) {
        toast.error('Patient profile not found');
        return;
      }

      const { error } = await supabase
        .from('consultations')
        .insert({
          patient_id: patientData.id,
          symptoms: selectedSymptoms,
          description,
          priority: aiAnalysis.priority,
          ai_recommendation: aiAnalysis.recommendation,
          suggested_specialty: aiAnalysis.specialty,
          follow_up_questions: aiAnalysis.followUpQuestions,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Consultation created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating consultation:', error);
      toast.error('Failed to create consultation');
    } finally {
      setLoading(false);
    }
  };

  const groupedSymptoms = symptoms.reduce((acc, symptom) => {
    if (!acc[symptom.category]) acc[symptom.category] = [];
    acc[symptom.category].push(symptom);
    return acc;
  }, {} as Record<string, Symptom[]>);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1420] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header with Back Button */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Go Back"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <h2 className="text-2xl font-bold text-white">New Consultation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Close"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Symptoms Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Your Symptoms
            </label>
            <div className="space-y-4">
              {Object.entries(groupedSymptoms).map(([category, categorySymptoms]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categorySymptoms.map((symptom) => (
                      <button
                        key={symptom.id}
                        onClick={() => toggleSymptom(symptom.name)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedSymptoms.includes(symptom.name)
                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {symptom.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Describe Your Symptoms
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
              placeholder="Please describe your symptoms in detail... When did they start? How severe are they?"
            />
          </div>

          {/* AI Analysis Button */}
          <Button
            onClick={analyzeWithAI}
            isLoading={analyzing}
            disabled={selectedSymptoms.length === 0 || !description.trim()}
            className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
          >
            {analyzing ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2" size={20} />
                Analyze with AI
              </>
            )}
          </Button>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <div className="bg-gradient-to-br from-blue-500/10 to-teal-500/10 border border-blue-500/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-teal-400" size={20} />
                <h3 className="font-semibold text-white">AI Analysis Results</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Priority Level</p>
                  <p className={`text-lg font-bold ${
                    aiAnalysis.priority === 'urgent' ? 'text-red-400' :
                    aiAnalysis.priority === 'high' ? 'text-orange-400' :
                    aiAnalysis.priority === 'medium' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {aiAnalysis.priority.toUpperCase()}
                  </p>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Suggested Specialty</p>
                  <p className="text-lg font-bold text-teal-400">{aiAnalysis.specialty}</p>
                </div>
              </div>

              <div className="bg-black/20 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Recommendation</p>
                <p className="text-sm text-gray-200">{aiAnalysis.recommendation}</p>
              </div>

              {aiAnalysis.followUpQuestions && aiAnalysis.followUpQuestions.length > 0 && (
                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-2">Questions for Doctor</p>
                  <ul className="space-y-1">
                    {aiAnalysis.followUpQuestions.map((question: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-teal-400 mt-1">•</span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-between gap-3 flex-shrink-0 bg-[#0f1420]">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft size={18} className="mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            isLoading={loading} 
            disabled={!aiAnalysis}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Submit Consultation
          </Button>
        </div>
      </div>
    </div>
  );
}