import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, User, Bot, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { InferenceClient } from "@huggingface/inference";
import toast from 'react-hot-toast';

const client = new InferenceClient(import.meta.env.VITE_HUGGINGFACE_API_KEY);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantModalProps {
  onClose: () => void;
}

export function AIAssistantModal({ onClose }: AIAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI health assistant powered by advanced AI. I can help you understand symptoms, provide health information, and guide you through the consultation process. How can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const prompt = `You are a helpful medical AI assistant on a healthcare platform. The patient asks: "${userMessage}"

Provide a clear, helpful, and professional response. If it's a serious medical concern, always advise seeing a doctor. Keep responses concise (2-4 sentences). Be friendly and supportive.`;

      const chatCompletion = await client.chatCompletion({
        model: "meta-llama/Llama-3.1-8B-Instruct:sambanova",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 300,
      });

      const response = chatCompletion.choices[0].message.content;
      return response || "I apologize, I'm having trouble generating a response. Please try rephrasing your question.";
      
    } catch (error) {
      console.error('AI response error:', error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await generateAIResponse(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again or create a consultation for more detailed assistance.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (question: string) => {
    setInput(question);
  };

  const quickQuestions = [
    "What should I do if I have a fever?",
    "How do I schedule an appointment?",
    "What are the symptoms of flu?",
    "When should I go to the ER?",
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1420] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
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
            <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Health Assistant</h2>
              <p className="text-sm text-gray-400">Powered by Llama 3.1 AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Close"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Messages - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-teal-600' 
                  : 'bg-gradient-to-br from-purple-500 to-blue-500'
              }`}>
                {message.role === 'user' ? (
                  <User size={16} className="text-white" />
                ) : (
                  <Bot size={16} className="text-white" />
                )}
              </div>
              
              <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'items-end' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 px-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin text-teal-400" size={16} />
                  <span className="text-sm text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Quick Questions */}
          {messages.length === 1 && !loading && (
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-3">Quick questions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(question)}
                    className="text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-sm text-gray-300 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Fixed at bottom */}
        <div className="px-6 py-4 border-t border-gray-800 flex-shrink-0 bg-[#0f1420]">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your health..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 px-6"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI responses are for informational purposes only. Always consult a healthcare professional for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}