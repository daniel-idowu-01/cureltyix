import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, MessageSquare } from 'lucide-react';
import { Button } from './Button';
import { getVoiceService } from '../services/voiceService';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface VoiceChatProps {
  onClose?: () => void;
}

export function VoiceChat({ onClose }: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [autoResumeListen, setAutoResumeListen] = useState(true);
  
  const voiceService = useRef(getVoiceService());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldResumeListening = useRef(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = () => {
        voiceService.current.getAvailableVoices();
      };
    }

    return () => {
      voiceService.current.cleanup();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (type: 'user' | 'ai', text: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
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
    let finalTranscriptRef = '';
    
    voiceService.current.startListening(
      (transcript, isFinal) => {
        if (isFinal) {
          finalTranscriptRef = transcript;
          setInterimTranscript('');
          
          setTimeout(() => {
            if (finalTranscriptRef && voiceService.current.getIsListening()) {
              const textToProcess = finalTranscriptRef;
              finalTranscriptRef = '';
              handleUserMessage(textToProcess);
            }
          }, 1200);
        } else {
          setInterimTranscript(transcript);
        }
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
        
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
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;

    shouldResumeListening.current = false;
    setIsListening(false);
    voiceService.current.stopListening();

    addMessage('user', text);
    setIsProcessing(true);

    try {
      const response = await getAIResponse(text);
      
      addMessage('ai', response);

      shouldResumeListening.current = autoResumeListen;

      if (autoSpeak) {
        speakText(response);
      } else if (autoResumeListen) {
        setTimeout(() => {
          if (shouldResumeListening.current && !isProcessing) {
            handleStartListening();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = 'I apologize, but I encountered an error processing your request. Please try again.';
      addMessage('ai', errorMessage);
      
      shouldResumeListening.current = autoResumeListen;
      
      if (autoSpeak) {
        speakText(errorMessage);
      } else if (autoResumeListen) {
        setTimeout(() => {
          if (shouldResumeListening.current && !isProcessing) {
            handleStartListening();
          }
        }, 500);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('symptom') || lowerMessage.includes('feel') || lowerMessage.includes('pain')) {
      return "I understand you're experiencing some symptoms. To provide you with the best assistance, could you please describe your symptoms in detail? For example, where do you feel pain, when did it start, and how severe is it?";
    }

    if (lowerMessage.includes('doctor') || lowerMessage.includes('appointment')) {
      return "I can help you connect with a doctor. Would you like me to help you create a consultation request? Please describe your symptoms and I'll recommend the appropriate specialist.";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm your AI health assistant. How can I help you today? You can tell me about any symptoms you're experiencing, or ask health-related questions.";
    }

    if (lowerMessage.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with today?";
    }

    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return "Goodbye! Take care of your health. Feel free to come back anytime you need assistance.";
    }

    return "I'm here to help with your health concerns. Could you please provide more details about what you'd like to discuss? You can describe any symptoms you're experiencing or ask health-related questions.";
  };

  const speakText = (text: string) => {
    setIsSpeaking(true);
    
    const preferredVoice = voiceService.current.getPreferredVoice();
    
    voiceService.current.speak(text, {
      voice: preferredVoice,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        
        if (shouldResumeListening.current && autoResumeListen) {
          setTimeout(() => {
            if (shouldResumeListening.current && !isProcessing) {
              handleStartListening();
            }
          }, 800); 
        }
      },
      onError: (error) => {
        console.error('Speech error:', error);
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
    
    if (autoResumeListen) {
      setTimeout(() => {
        handleStartListening();
      }, 500);
    }
  };

  const handleReplay = (text: string) => {
    if (isSpeaking) {
      handleStopSpeaking();
    } else {
      shouldResumeListening.current = autoResumeListen;
      speakText(text);
    }
  };

  const toggleAutoListen = () => {
    const newValue = !autoResumeListen;
    setAutoResumeListen(newValue);
    
    if (newValue) {
      toast.success('Auto-listen enabled');
    } else {
      toast.success('Auto-listen disabled');
      shouldResumeListening.current = false;
      handleStopListening();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <MessageSquare className="text-teal-600 dark:text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Voice Assistant</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Speak to get health assistance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-2 rounded-lg transition-colors ${
                autoSpeak
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title={autoSpeak ? 'Auto-speak enabled' : 'Auto-speak disabled'}
            >
              {autoSpeak ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={toggleAutoListen}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                autoResumeListen
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
              title={autoResumeListen ? 'Auto-listen ON' : 'Auto-listen OFF'}
            >
              {autoResumeListen ? '🎤 Auto' : '🎤 Manual'}
            </button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No messages yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Click the microphone button to start speaking
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <p className="text-sm flex-1">{message.text}</p>
                  {message.type === 'ai' && (
                    <button
                      onClick={() => handleReplay(message.text)}
                      className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Play/Stop audio"
                    >
                      {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  )}
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {interimTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-teal-400 text-white opacity-70">
                <p className="text-sm italic">{interimTranscript}</p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-4">
            {isListening ? (
              <Button
                onClick={handleStopListening}
                variant="danger"
                size="lg"
                className="flex items-center gap-2"
              >
                <MicOff size={24} />
                Stop Listening
              </Button>
            ) : (
              <Button
                onClick={handleStartListening}
                size="lg"
                className="flex items-center gap-2"
                disabled={isProcessing || isSpeaking}
              >
                <Mic size={24} />
                {isProcessing ? 'Processing...' : isSpeaking ? 'AI Speaking...' : 'Start Speaking'}
              </Button>
            )}

            {isSpeaking && (
              <Button
                onClick={handleStopSpeaking}
                variant="secondary"
                size="lg"
                className="flex items-center gap-2"
              >
                <VolumeX size={24} />
                Skip AI
              </Button>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {isListening && (
                <span className="flex items-center justify-center gap-2">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Listening... {autoResumeListen && '(Auto-resume enabled)'}
                </span>
              )}
              {!isListening && !isProcessing && !isSpeaking && (
                <span>
                  {autoResumeListen 
                    ? 'Auto-listen enabled - Microphone will activate after AI response'
                    : 'Click the microphone to speak'}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}