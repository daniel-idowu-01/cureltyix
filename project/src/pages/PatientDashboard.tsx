import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { supabase, Symptom } from '../lib/supabase';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { Moon, Sun, Activity, Clock, CheckCircle, AlertCircle, Plus, Loader2, Mic, Shield, ArrowLeft, Bell, MessageSquare, X, Lightbulb } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ConsultationProps } from '../types/consultation';
import { getAIService } from '../services/aiService';
import { AIVoiceConsultation } from '../components/AIVoiceConsultation';
import { VoiceChat } from '../components/VoiceChat';
import { PatientDropdown } from '../components/PatientDropdown';
import { EditProfileModal } from '../components/EditProfileModal';
import { NotificationsPanel } from '../components/NotificationsPanel';
import toast from 'react-hot-toast';

// Daily health tips
const healthTips = [
  "💧 Drink at least 8 glasses of water daily to stay hydrated and maintain optimal body functions.",
  "🥗 Include colorful fruits and vegetables in every meal for essential vitamins and minerals.",
  "🚶‍♂️ Aim for 30 minutes of moderate exercise daily to boost your cardiovascular health.",
  "😴 Get 7-9 hours of quality sleep each night to support your immune system and mental health.",
  "🧘‍♀️ Practice deep breathing or meditation for 10 minutes daily to reduce stress.",
  "🦷 Brush your teeth twice daily and floss once to maintain good oral hygiene.",
  "☀️ Get 15 minutes of sunlight daily for natural vitamin D production.",
  "🥜 Snack on nuts and seeds for healthy fats and protein throughout the day.",
  "📱 Take regular breaks from screens every 20 minutes to protect your eyes.",
  "🤝 Stay socially connected with friends and family for better mental health.",
  "🍎 Eat an apple a day - it's packed with fiber and antioxidants.",
  "🏃‍♀️ Take the stairs instead of the elevator when possible for extra cardio.",
  "🥛 Include calcium-rich foods in your diet for strong bones and teeth.",
  "🧼 Wash your hands frequently with soap for at least 20 seconds.",
  "🎵 Listen to music you enjoy - it can improve mood and reduce stress.",
];

export function PatientDashboard() {
  const { user } = useAuth();
  const { currentRole, switchRole } = useRole();
  const { theme, toggleTheme } = useTheme();

  const [consultations, setConsultations] = useState<ConsultationProps[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [showVoiceConsultation, setShowVoiceConsultation] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [dailyTip, setDailyTip] = useState('');

  const isAdminViewing = user?.role === 'admin' && currentRole === 'patient';

  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadConsultations();
    loadSymptoms();
    loadDailyTip();
  }, []);

  const loadDailyTip = () => {
    // Get a consistent tip based on the current date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const tipIndex = dayOfYear % healthTips.length;
    setDailyTip(healthTips[tipIndex]);
  };

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

  const handleVoiceConsultationSubmit = async (symptoms: string[], desc: string) => {
    setSelectedSymptoms(symptoms);
    setDescription(desc);
    
    setAnalyzing(true);
    try {
      const aiService = getAIService();
      const analysis = await aiService.analyzeSymptoms(symptoms, desc);
      setAiAnalysis(analysis);
      
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
        .insert({
          patient_id: patientData.id,
          symptoms: symptoms,
          description: desc,
          priority: analysis.priority,
          ai_recommendation: analysis.recommendation,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      const consultationWithAI = {
        ...data,
        suggested_specialty: analysis.specialty,
        follow_up_questions: analysis.followUpQuestions,
      };

      toast.success('Voice consultation created successfully!');
      setConsultations([consultationWithAI, ...consultations]);
      setShowVoiceConsultation(false);
    } catch (error) {
      console.error('Error creating voice consultation:', error);
      toast.error('Failed to create voice consultation');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBackToAdmin = () => {
    switchRole('admin');
    toast.success('Returned to Admin view');
  };

  const handleAIAssistantMessage = async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiLoading(true);

    try {
      const aiService = getAIService();
      const response = await aiService.chatWithAI(userMessage, aiMessages);
      
      setAiMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast.error('Failed to get AI response');
      const errorMessage = 'Sorry, I encountered an error. Please try again.';
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage 
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const closeAIAssistant = () => {
    setShowAIAssistant(false);
    setAiMessages([]);
    setAiInput('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />;
      case 'assigned': return <Activity className="text-blue-600 dark:text-blue-400" size={20} />;
      case 'completed': return <CheckCircle className="text-green-600 dark:text-green-400" size={20} />;
      case 'cancelled': return <AlertCircle className="text-red-600 dark:text-red-400" size={20} />;
      default: return <Clock className="text-gray-600 dark:text-gray-400" size={20} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  const groupedSymptoms = symptoms.reduce((acc, symptom) => {
    if (!acc[symptom.category]) {
      acc[symptom.category] = [];
    }
    acc[symptom.category].push(symptom);
    return acc;
  }, {} as Record<string, Symptom[]>);

  const completedCount = consultations.filter(c => c.status === 'completed').length;
  const pendingCount = consultations.filter(c => c.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0e1a]">
      {isAdminViewing && (
        <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 border-b border-purple-500/30">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="text-purple-400" size={20} />
              <div>
                <p className="text-sm font-semibold text-purple-300">Admin Mode - Viewing as Patient</p>
                <p className="text-xs text-purple-400">You're viewing the patient dashboard with full access</p>
              </div>
            </div>
            <button
              onClick={handleBackToAdmin}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium text-white"
            >
              <ArrowLeft size={16} />
              Back to Admin
            </button>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-[#1a1f2e] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} className="text-gray-400" /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setShowNotifications(true)}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Welcome, {user?.full_name?.split(' ')[0] || 'Kelvin Ade'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Patient</div>
              </div>
              <PatientDropdown onViewProfile={() => setShowEditProfile(true)} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Patient Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your health consultations with AI assistance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Activity className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Consultations</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{consultations.length}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Completed</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
          </div>
        </div>

        {/* Daily Health Tip */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl shadow-sm p-6 mb-8 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Lightbulb className="text-white" size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">💡 Daily Health Tip</h3>
              <p className="text-white/90 leading-relaxed">{dailyTip}</p>
              <p className="text-xs text-white/70 mt-2">Tip changes daily - check back tomorrow!</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowNewConsultation(!showNewConsultation)}
              className="flex items-center gap-3 p-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors"
            >
              <Plus size={20} />
              <span className="font-medium">New Consultation</span>
            </button>
            <button
              onClick={() => setShowVoiceChat(true)}
              className="flex items-center gap-3 p-4 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-xl transition-colors"
            >
              <Mic size={20} />
              <span className="font-medium">Voice Chat</span>
            </button>
            <button
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className="flex items-center gap-3 p-4 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-xl transition-colors"
            >
              <MessageSquare size={20} />
              <span className="font-medium">AI Assistant</span>
            </button>
          </div>
        </div>

        {/* AI Assistant Chat */}
        {showAIAssistant && (
          <div className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Health Assistant</h2>
              <button
                onClick={closeAIAssistant}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {aiMessages.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Ask me anything about your health concerns!</p>
              ) : (
                aiMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <Loader2 className="animate-spin" size={20} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAIAssistantMessage()}
                placeholder="Type your question..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Button onClick={handleAIAssistantMessage} disabled={aiLoading || !aiInput.trim()}>Send</Button>
            </div>
          </div>
        )}

        {/* New Consultation Form */}
        {showNewConsultation && (
          <div className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
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
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            {aiAnalysis && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">AI Recommendations</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Priority:</strong> {aiAnalysis.priority}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Suggested Specialty:</strong> {aiAnalysis.specialty || 'General Practitioner'}</p>
                {aiAnalysis.recommendation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Recommendation:</strong> {aiAnalysis.recommendation}</p>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={analyzeWithAI} disabled={analyzing}>
                {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : 'Analyze with AI'}
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !aiAnalysis}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Submit'}
              </Button>
              <Button variant="ghost" onClick={() => setShowNewConsultation(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Consultations List */}
        <div className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Consultations</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {consultations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 dark:text-gray-400">No consultations yet</p>
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
                          {new Date(consultation.created_at).toLocaleDateString()}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">{consultation.description}</p>
                  {consultation.doctor_notes && (
                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Doctor's Notes</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{consultation.doctor_notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showVoiceConsultation && <AIVoiceConsultation onClose={() => setShowVoiceConsultation(false)} onSubmitSymptoms={handleVoiceConsultationSubmit} />}
      {showVoiceChat && <VoiceChat onClose={() => setShowVoiceChat(false)} />}
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
