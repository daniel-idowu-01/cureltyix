import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Send, X } from 'lucide-react';
import { Button } from './Button';
import { getVoiceService } from '../services/voiceService';
import { getAIService } from '../services/aiService';
import toast from 'react-hot-toast';

interface AIVoiceConsultationProps {
  onClose: () => void;
  onSubmitSymptoms?: (symptoms: string[], description: string) => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface ConversationState {
  stage: 'greeting' | 'collecting' | 'analyzing' | 'complete';
  turnCount: number;
  symptoms: string[];
  fullTranscript: string[];
}

export function AIVoiceConsultation({ onClose, onSubmitSymptoms }: AIVoiceConsultationProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [autoResumeListen, setAutoResumeListen] = useState(true);
  
  const conversationState = useRef<ConversationState>({
    stage: 'greeting',
    turnCount: 0,
    symptoms: [],
    fullTranscript: [],
  });
  
  const voiceService = useRef(getVoiceService());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldResumeListening = useRef(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const greeting = "Hello! I'm your AI health assistant. What brings you here today?";
    addMessage('ai', greeting);
    speakText(greeting);

    return () => {
      voiceService.current.cleanup();
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((type: 'user' | 'ai', text: string) => {
    const message: Message = {
      id: Date.now().toString() + Math.random(),
      type,
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const extractSymptoms = (text: string): string[] => {
    const symptomKeywords = [
      'fever', 'cough', 'cold', 'headache', 'migraine', 'pain', 'ache', 'aching',
      'nausea', 'vomiting', 'dizzy', 'dizziness', 'fatigue', 'tired', 'weakness',
      'sore', 'throat', 'runny nose', 'congestion', 'chills', 'sweating',
      'diarrhea', 'constipation', 'rash', 'itching', 'swelling', 'bleeding',
      'breathing', 'chest pain', 'stomach', 'abdominal', 'back pain', 'neck pain',
    ];

    const lowerText = text.toLowerCase();
    const found: string[] = [];

    if (lowerText.includes("don't") || lowerText.includes("no ") || lowerText.includes("nothing")) {
      return [];
    }

    symptomKeywords.forEach(symptom => {
      if (lowerText.includes(symptom)) {
        const formatted = symptom.charAt(0).toUpperCase() + symptom.slice(1);
        if (!found.includes(formatted)) {
          found.push(formatted);
        }
      }
    });

    return found;
  };

  const handleStartListening = () => {
    if (!voiceService.current.isSpeechRecognitionSupported()) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isSpeaking) {
      voiceService.current.stopSpeaking();
      setIsSpeaking(false);
    }

    setInterimTranscript('');
    let accumulatedTranscript = '';
    
    voiceService.current.startListening(
      (transcript, isFinal) => {
        if (isFinal) {
          accumulatedTranscript = transcript;
          setInterimTranscript('');
          
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
          }
          
          processingTimeoutRef.current = setTimeout(() => {
            if (accumulatedTranscript && voiceService.current.getIsListening()) {
              const textToProcess = accumulatedTranscript;
              accumulatedTranscript = '';
              handleUserMessage(textToProcess);
            }
          }, 2000);
        } else {
          setInterimTranscript(transcript);
        }
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
        
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
          processingTimeoutRef.current = null;
        }
        
        if (error !== 'no-speech' && error !== 'aborted') {
          toast.error(`Speech recognition error: ${error}`);
        }
        
        if ((error === 'no-speech' || error === 'aborted') && shouldResumeListening.current && autoResumeListen) {
          setTimeout(() => {
            if (shouldResumeListening.current && !isSpeaking && !isProcessing) {
              handleStartListening();
            }
          }, 500);
        }
      }
    );

    setIsListening(true);
    shouldResumeListening.current = true;
  };

  const handleStopListening = () => {
    voiceService.current.stopListening();
    setIsListening(false);
    setInterimTranscript('');
    shouldResumeListening.current = false;
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;

    shouldResumeListening.current = false;
    setIsListening(false);
    voiceService.current.stopListening();
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    addMessage('user', text);
    setIsProcessing(true);

    try {
      const newSymptoms = extractSymptoms(text);
      conversationState.current.fullTranscript.push(text);
      conversationState.current.turnCount += 1;
      
      if (newSymptoms.length > 0) {
        conversationState.current.symptoms = [
          ...new Set([...conversationState.current.symptoms, ...newSymptoms])
        ];
      }

      const aiResponse = await getAIResponseForState(text);
      
      if (aiResponse.nextStage) {
        conversationState.current.stage = aiResponse.nextStage;
      }

      addMessage('ai', aiResponse.message);
      shouldResumeListening.current = autoResumeListen;
      speakText(aiResponse.message);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = 'I apologize, but I encountered an error. Please try again.';
      addMessage('ai', errorMessage);
      shouldResumeListening.current = autoResumeListen;
      speakText(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAIResponseForState = async (userMessage: string): Promise<{ message: string; nextStage?: ConversationState['stage'] }> => {
    const { stage, turnCount, symptoms } = conversationState.current;
    const lowerMsg = userMessage.toLowerCase();
    const hasSymptoms = symptoms.length > 0;

    console.log('State:', { stage, turnCount, symptoms, hasSymptoms });

    if (stage === 'greeting') {
      if (hasSymptoms) {
        return {
          message: `I understand you're experiencing ${symptoms[0].toLowerCase()}. Tell me more about it - when did it start?`,
          nextStage: 'collecting',
        };
      }
      return {
        message: "Please describe your symptoms. What's bothering you?",
        nextStage: 'collecting',
      };
    }

    if (stage === 'collecting') {
      if (!hasSymptoms && turnCount >= 3) {
        return {
          message: "I'm having trouble identifying specific symptoms. Could you describe what physical sensations or problems you're experiencing?",
          nextStage: 'collecting',
        };
      }

      if (hasSymptoms && turnCount >= 3) {
        return {
          message: `Okay, I've noted: ${symptoms.join(', ')}. Anything else, or should I analyze these symptoms?`,
          nextStage: 'analyzing',
        };
      }

      const questions = [
        "When did these symptoms start?",
        "How severe would you say they are?",
        "Have you noticed any patterns or triggers?",
      ];
      
      return {
        message: questions[Math.min(turnCount - 1, questions.length - 1)] || questions[questions.length - 1],
        nextStage: 'collecting',
      };
    }

    if (stage === 'analyzing') {
      const wantsAnalysis = lowerMsg.includes('no') || lowerMsg.includes('nothing') || 
                            lowerMsg.includes('analyze') || lowerMsg.includes('yes') ||
                            lowerMsg.includes("that's all") || lowerMsg.includes('nope');

      if (wantsAnalysis) {
        if (symptoms.length === 0) {
          return {
            message: "I don't have any symptoms recorded. Could you describe what you're feeling?",
            nextStage: 'collecting',
          };
        }

        const analysis = await performAnalysis();
        return {
          message: analysis,
          nextStage: 'complete',
        };
      }

      return {
        message: "Noted. Any other symptoms?",
        nextStage: 'analyzing',
      };
    }

    if (stage === 'complete') {
      const wantsConsultation = lowerMsg.includes('yes') || lowerMsg.includes('create') || 
                                 lowerMsg.includes('sure') || lowerMsg.includes('please');

      if (wantsConsultation) {
        return {
          message: "Perfect! I'll create your consultation request now.",
          nextStage: 'complete',
        };
      }

      return {
        message: "No problem. Let me know if you need anything else.",
        nextStage: 'complete',
      };
    }

    return {
      message: "Could you tell me more?",
      nextStage: 'collecting',
    };
  };

  const performAnalysis = async (): Promise<string> => {
    const { symptoms, fullTranscript } = conversationState.current;
    const description = fullTranscript.join(' ');

    try {
      const aiService = getAIService();
      const analysis = await aiService.analyzeSymptoms(symptoms, description);

      return `Based on your symptoms, here's my analysis:

Priority: ${analysis.priority.toUpperCase()}
Recommendation: ${analysis.recommendation}
Specialty: ${analysis.specialty || 'General Practitioner'}

Would you like me to create a consultation request?`;
    } catch (error) {
      console.error('Analysis error:', error);
      return `I've recorded your symptoms: ${symptoms.join(', ')}. Would you like me to create a consultation request for a doctor to review?`;
    }
  };

  const speakText = (text: string) => {
    setIsSpeaking(true);
    const preferredVoice = voiceService.current.getPreferredVoice();
    
    voiceService.current.speak(text, {
      voice: preferredVoice,
      rate: 0.95,
      pitch: 1.0,
      volume: 1.0,
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        if (shouldResumeListening.current && autoResumeListen && conversationState.current.stage !== 'complete') {
          setTimeout(() => {
            if (shouldResumeListening.current && !isProcessing) {
              handleStartListening();
            }
          }, 800);
        }
      },
      onError: () => {
        setIsSpeaking(false);
        if (shouldResumeListening.current && autoResumeListen) {
          setTimeout(() => {
            if (shouldResumeListening.current && !isProcessing) {
              handleStartListening();
            }
          }, 800);
        }
      },
    });
  };

  const handleStopSpeaking = () => {
    voiceService.current.stopSpeaking();
    setIsSpeaking(false);
    if (autoResumeListen && conversationState.current.stage !== 'complete') {
      setTimeout(() => handleStartListening(), 500);
    }
  };

  const handleCreateConsultation = () => {
    shouldResumeListening.current = false;
    handleStopListening();
    
    const { symptoms, fullTranscript } = conversationState.current;
    const description = fullTranscript.join('\n\n');

    if (onSubmitSymptoms) {
      onSubmitSymptoms(symptoms, description);
    }
    
    toast.success('Consultation request created!');
    onClose();
  };

  const toggleAutoListen = () => {
    const newValue = !autoResumeListen;
    setAutoResumeListen(newValue);
    toast.success(newValue ? 'Auto-listen enabled' : 'Auto-listen disabled');
    
    if (!newValue) {
      shouldResumeListening.current = false;
      handleStopListening();
    }
  };

  const currentSymptoms = conversationState.current.symptoms;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Voice Consultation</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Speak naturally about your symptoms</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoListen}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                autoResumeListen
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {autoResumeListen ? '🎤 Auto' : '🎤 Manual'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        {currentSymptoms.length > 0 && (
          <div className="px-6 py-3 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-200 dark:border-teal-800">
            <p className="text-sm font-medium text-teal-900 dark:text-teal-200 mb-2">Detected Symptoms:</p>
            <div className="flex flex-wrap gap-2">
              {currentSymptoms.map((symptom, index) => (
                <span key={index} className="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-full text-xs font-medium">
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {interimTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-lg px-4 py-3 bg-teal-400 text-white opacity-70">
                <p className="text-sm italic">{interimTranscript}</p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-700">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Loader2 className="animate-spin" size={16} />
                  <p className="text-sm">Analyzing...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-3 mb-3">
            {isListening ? (
              <Button onClick={handleStopListening} variant="danger" size="lg" className="flex items-center gap-2">
                <MicOff size={24} />
                Stop Listening
              </Button>
            ) : (
              <Button onClick={handleStartListening} size="lg" className="flex items-center gap-2" disabled={isProcessing || isSpeaking}>
                <Mic size={24} />
                {isProcessing ? 'Processing...' : isSpeaking ? 'AI Speaking...' : 'Speak'}
              </Button>
            )}

            {isSpeaking && (
              <Button onClick={handleStopSpeaking} variant="secondary" size="md" className="flex items-center gap-2">
                <VolumeX size={20} />
                Skip AI
              </Button>
            )}

            {conversationState.current.stage === 'complete' && currentSymptoms.length > 0 && (
              <Button onClick={handleCreateConsultation} variant="primary" size="md" className="flex items-center gap-2">
                <Send size={20} />
                Create Consultation
              </Button>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {isListening && (
                <span className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Listening...
                </span>
              )}
              {isSpeaking && !isListening && (
                <span className="flex items-center justify-center gap-2 text-teal-600 dark:text-teal-400">
                  <Volume2 size={14} className="animate-pulse" />
                  AI is speaking...
                </span>
              )}
              {!isListening && !isSpeaking && !isProcessing && (
                <span>{autoResumeListen ? 'Auto-listen enabled' : 'Click microphone to speak'}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}