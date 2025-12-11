'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Task {
  id: number;
  description: string;
  done: boolean;
}

interface SubTask {
  id: number;
  description: string;
  done: boolean;
}

interface PlannedTask {
  id: number;
  description: string;
  subtasks: SubTask[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [spinnerMessage, setSpinnerMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAnswer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setTasks([]);
    setPlannedTasks([]);
    setCurrentAnswer('');
    setSpinnerMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          messageHistory: messages,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventMatch = line.match(/event: (\w+)\ndata: (.+)/s);
            if (eventMatch) {
              const [, event, dataStr] = eventMatch;
              const data = JSON.parse(dataStr);

              switch (event) {
                case 'tasks':
                  setTasks(prev => [...prev, ...data.tasks]);
                  break;
                case 'subtasks':
                  setPlannedTasks(prev => [...prev, ...data.subtasks]);
                  break;
                case 'taskComplete':
                  setTasks(prev => prev.map(t =>
                    t.id === data.taskId ? { ...t, done: true } : t
                  ));
                  break;
                case 'subtaskComplete':
                  setPlannedTasks(prev => prev.map(pt =>
                    pt.id === data.taskId
                      ? {
                          ...pt,
                          subtasks: pt.subtasks.map(st =>
                            st.id === data.subTaskId ? { ...st, done: true } : st
                          ),
                        }
                      : pt
                  ));
                  break;
                case 'spinner':
                  setSpinnerMessage(data.active ? data.message || '' : '');
                  break;
                case 'answerStart':
                  setCurrentAnswer('');
                  break;
                case 'answer':
                  setCurrentAnswer(prev => prev + data.chunk);
                  break;
                case 'answerEnd':
                  setMessages(prev => [...prev, { role: 'assistant', content: currentAnswer }]);
                  setCurrentAnswer('');
                  break;
                case 'error':
                  console.error('Error:', data.error);
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Error: ${data.error}`
                  }]);
                  break;
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setLoading(false);
      setTasks([]);
      setPlannedTasks([]);
      setSpinnerMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Dexter 🤖</h1>
        <p className="text-gray-600">AI Financial Research Agent</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-4">Ask me anything about financial data!</p>
            <div className="text-sm space-y-2">
              <p>Try: &quot;What was Apple&apos;s revenue growth over the last 4 quarters?&quot;</p>
              <p>Or: &quot;Compare Microsoft and Google&apos;s operating margins for 2023&quot;</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {/* Current Answer Streaming */}
        {currentAnswer && (
          <div className="flex justify-start">
            <div className="max-w-3xl rounded-lg p-4 bg-white border border-gray-200">
              <p className="whitespace-pre-wrap">{currentAnswer}</p>
            </div>
          </div>
        )}

        {/* Tasks Display */}
        {(tasks.length > 0 || plannedTasks.length > 0) && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold mb-2">Tasks:</h3>
            {plannedTasks.map(task => (
              <div key={task.id} className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={task.subtasks.every(st => st.done) ? 'text-green-500' : 'text-blue-500'}>
                    {task.subtasks.every(st => st.done) ? '✓' : '○'}
                  </span>
                  <span className={task.subtasks.every(st => st.done) ? 'line-through' : ''}>
                    {task.description}
                  </span>
                </div>
                <div className="ml-6 space-y-1">
                  {task.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center gap-2 text-sm">
                      <span className={subtask.done ? 'text-green-500' : 'text-gray-400'}>
                        {subtask.done ? '✓' : '○'}
                      </span>
                      <span className={subtask.done ? 'line-through text-gray-500' : 'text-gray-700'}>
                        {subtask.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Spinner */}
        {spinnerMessage && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span>{spinnerMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about financial data..."
          disabled={loading}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
