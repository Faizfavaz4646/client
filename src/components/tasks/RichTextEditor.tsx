import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  Heading1, Heading2, Quote, Code, List, ListOrdered, 
  ImageIcon, Undo, Redo 
} from 'lucide-react'

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Image, Underline],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        className: 'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[150px] px-4 py-3 marker:text-indigo-400 prose-p:text-slate-300 prose-headings:text-white prose-strong:text-white [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const fakeUrl = URL.createObjectURL(file); 
      editor.chain().focus().setImage({ src: fakeUrl }).run();
    };
    input.click();
  };

  const ToolbarButton = ({ onClick, isActive, disabled = false, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded transition-colors ${
        isActive 
          ? 'bg-indigo-500/20 text-indigo-400' 
          : 'text-neutral-400 hover:text-white hover:bg-white/10'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full bg-[#1d2345] border border-indigo-500/20 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400/50 focus-within:border-transparent transition-all shadow-inner">
      <style>{`
        .ProseMirror {
          min-height: 150px;
          padding: 12px 16px;
          outline: none;
        }
        .ProseMirror p {
          color: #e2e8f0; /* slate-200 */
          margin-bottom: 0.5rem;
        }
        .ProseMirror h1, .ProseMirror h2 {
          color: #ffffff;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror h1 { font-size: 1.5rem; }
        .ProseMirror h2 { font-size: 1.25rem; }
        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-bottom: 1rem;
          color: #e2e8f0;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-bottom: 1rem;
          color: #e2e8f0;
        }
        .ProseMirror li { margin-bottom: 0.25rem; display: list-item !important; }
        .ProseMirror li p { display: inline; }
        .ProseMirror blockquote {
          border-left: 3px solid #6366f1;
          padding-left: 1rem;
          color: #94a3b8;
          font-style: italic;
        }
        .ProseMirror pre {
          background-color: #0b0f1f;
          padding: 0.75rem;
          border-radius: 0.5rem;
          color: #e2e8f0;
        }
      `}</style>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-indigo-500/20 bg-[#252b4d] shadow-sm">
        
        {/* History */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo size={15} strokeWidth={2.5} />
        </ToolbarButton>

        <div className="w-px h-4 bg-indigo-500/20 mx-1" />

        {/* Inline Formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
          <Bold size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
          <Italic size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
          <UnderlineIcon size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
          <Strikethrough size={15} strokeWidth={2.5} />
        </ToolbarButton>

        <div className="w-px h-4 bg-indigo-500/20 mx-1" />

        {/* Headings */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>
          <Heading1 size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
          <Heading2 size={15} strokeWidth={2.5} />
        </ToolbarButton>

        <div className="w-px h-4 bg-indigo-500/20 mx-1" />

        {/* Lists & Blocks */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
          <List size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
          <ListOrdered size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}>
          <Quote size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')}>
          <Code size={15} strokeWidth={2.5} />
        </ToolbarButton>

        <div className="w-px h-4 bg-indigo-500/20 mx-1" />

        {/* Media */}
        <ToolbarButton onClick={handleImageUpload}>
          <ImageIcon size={15} strokeWidth={2.5} />
        </ToolbarButton>
      </div>

      {/* TEXT AREA */}
      <EditorContent editor={editor} />
    </div>
  );
}