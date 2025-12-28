import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Symptom, Consultation, Patient } from '../lib/supabase';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { Moon, Sun, LogOut, Activity, Clock, CheckCircle, AlertCircle, Plus, Loader2, Badge } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ConsultationProps } from '../types/consultation';
import { getAIService } from '../services/aiService';
import toast from 'react-hot-toast';

export function PatientDashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [consultations, setConsultations] = useState<ConsultationProps[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);

  useEffect(() => {
    loadConsultations();
    loadSymptoms();
  }, []);

  const loadConsultations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!patientData) return;

      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error loading consultations:', error);
    }
  };

  const loadSymptoms = async () => {
    try {
      const { data } = await supabase.from('symptoms').select('*').order('category', { ascending: true });
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

      const { data, error } = await supabase
        .from('consultations')
        .insert({
          patient_id: patientData.id,
          symptoms: selectedSymptoms,
          description: description.trim(),
          priority: aiAnalysis.priority,
          ai_recommendation: aiAnalysis.recommendation,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      const consultationWithAI = {
        ...data,
        suggested_specialty: aiAnalysis.specialty,
        follow_up_questions: aiAnalysis.followUpQuestions,
      };

      toast.success('Consultation created successfully with AI analysis!');
      setConsultations([consultationWithAI, ...consultations]);

      setSelectedSymptoms([]);
      setDescription('');
      setAiAnalysis(null);
      setShowNewConsultation(false);
    } catch (error: any) {
      console.error('Error creating consultation:', error);
      toast.error(error.message || 'Failed to create consultation');
    } finally {
      setLoading(false);
    }
  };

  const groupedSymptoms = symptoms.reduce((acc, symptom) => {
    if (!acc[symptom.category]) acc[symptom.category] = [];
    acc[symptom.category].push(symptom);
    return acc;
  }, {} as Record<string, Symptom[]>);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="text-yellow-500" size={20} />;
      case 'assigned': return <Activity className="text-blue-500" size={20} />;
      case 'completed': return <CheckCircle className="text-green-500" size={20} />;
      case 'cancelled': return <AlertCircle className="text-red-500" size={20} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Welcome, <span className="font-semibold">{user?.full_name}</span>
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Patient Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your health consultations and symptoms</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <Activity className="text-teal-600 dark:text-teal-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Consultations</h3>
            </div>
            <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{consultations.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {consultations.filter(c => c.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Completed</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {consultations.filter(c => c.status === 'completed').length}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <Button onClick={() => setShowNewConsultation(!showNewConsultation)}>
            <Plus size={18} className="mr-2" />
            New Consultation
          </Button>
        </div>

{showNewConsultation && (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">New Consultation Request</h2>

    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Your Symptoms</label>
      <div className="space-y-4">
        {Object.entries(groupedSymptoms).map(([category, categorySymptoms]) => (
          <div key={category}>
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{category}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {categorySymptoms.map(symptom => (
                <button
                  key={symptom.id}
                  type="button"
                  onClick={() => toggleSymptom(symptom.name)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedSymptoms.includes(symptom.name)
                      ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-2 border-teal-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
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

    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Please describe your symptoms in detail..."
        rows={4}
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
      />
    </div>

    {/* AI Analysis Section */}
    {aiAnalysis && (
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">AI Recommendations</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><strong>Priority:</strong> {aiAnalysis.priority}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><strong>Suggested Specialty:</strong> {aiAnalysis.specialty || 'General Practitioner'}</p>
        {aiAnalysis.recommendation && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><strong>Recommendation:</strong> {aiAnalysis.recommendation}</p>
        )}
        {aiAnalysis.followUpQuestions?.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Follow-up Questions:</p>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
              {aiAnalysis.followUpQuestions.map((q: string, idx: number) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}

    <div className="flex gap-3">
      <Button onClick={analyzeWithAI} disabled={analyzing}>
        {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing with AI...</> : 'Analyze with AI'}
      </Button>
      <Button onClick={handleSubmit} disabled={loading || !aiAnalysis}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Submit Consultation'}
      </Button>
      <Button variant="ghost" onClick={() => setShowNewConsultation(false)}>Cancel</Button>
    </div>
  </div>
)}


        {/* Consultations List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Consultations</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {consultations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 dark:text-gray-400">No consultations yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Create your first consultation to get started</p>
              </div>
            ) : (
              consultations.map(consultation => (
                <div key={consultation.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(consultation.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{consultation.status}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(consultation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getPriorityColor(consultation.priority)}`}>
                      {consultation.priority}
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms:</p>
                    <div className="flex flex-wrap gap-2">
                      {consultation.symptoms.map((symptom, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{consultation.description}</p>

                  {consultation.suggested_specialty && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Suggested Specialist:</p>
                      <Badge>{consultation.suggested_specialty}</Badge>
                    </div>
                  )}

                  {consultation.follow_up_questions && consultation.follow_up_questions?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Questions for Your Doctor:</p>
                      <ul className="space-y-1">
                        {consultation?.follow_up_questions.map((q, idx) => (
                          <li key={idx} className="text-sm text-gray-600">• {q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {consultation.doctor_notes && (
                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Doctor's Notes</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{consultation.doctor_notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
