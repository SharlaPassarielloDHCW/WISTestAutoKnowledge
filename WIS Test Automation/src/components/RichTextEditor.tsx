import { useState } from 'react';
import { Bold, Italic, List, ListOrdered, Code, Heading2, Quote } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 'min-h-48' }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newText = beforeText + before + selectedText + after + afterText;
    onChange(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeText = value.substring(0, start);
    const afterText = value.substring(start);

    onChange(beforeText + text + afterText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const formatPreview = (text: string) => {
    let formatted = text;

    // Headers
    formatted = formatted.replace(/^## (.+)$/gm, '<h3 class="font-bold text-lg mt-4 mb-2">$1</h3>');
    
    // Bold
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
    
    // Italic
    formatted = formatted.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
    
    // Code blocks
    formatted = formatted.replace(/```(.+?)```/gs, '<pre class="bg-gray-100 p-3 rounded my-2 overflow-x-auto"><code>$1</code></pre>');
    
    // Inline code
    formatted = formatted.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
    
    // Unordered lists
    formatted = formatted.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>');
    formatted = formatted.replace(/(<li class="ml-4">.*<\/li>\n?)+/g, '<ul class="list-disc ml-4 my-2">$&</ul>');
    
    // Ordered lists
    formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>');
    
    // Blockquotes
    formatted = formatted.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">$1</blockquote>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => insertFormatting('**', '**')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('*', '*')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('`', '`')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Code"
        >
          <Code size={16} />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => insertAtCursor('## ')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Heading"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('- ')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('1. ')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('> ')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Quote"
        >
          <Quote size={16} />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => insertFormatting('```\n', '\n```')}
          className="px-3 py-1 hover:bg-gray-200 rounded transition-colors text-sm"
          title="Code Block"
        >
          Code Block
        </button>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`px-3 py-1 rounded transition-colors text-sm ${
              !showPreview ? 'bg-[#005EB8] text-white' : 'hover:bg-gray-200'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`px-3 py-1 rounded transition-colors text-sm ${
              showPreview ? 'bg-[#005EB8] text-white' : 'hover:bg-gray-200'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      {showPreview ? (
        <div
          className={`p-4 ${minHeight} overflow-y-auto bg-white prose max-w-none`}
          dangerouslySetInnerHTML={{ __html: formatPreview(value) || '<p class="text-gray-400">Nothing to preview</p>' }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 focus:outline-none resize-y ${minHeight} bg-white`}
        />
      )}

      {/* Helper Text */}
      <div className="bg-gray-50 border-t border-gray-300 px-3 py-2 text-xs text-gray-500">
        Use **bold**, *italic*, `code`, ## headings, - lists, {'>'}quotes, ```code blocks```
      </div>
    </div>
  );
}