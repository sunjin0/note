'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { cn } from '@/core/utils';
import { useTranslation } from '@/core/i18n';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link as LinkIcon,
  Minus,
  Undo,
  Redo,
  Eraser,
  Highlighter,
  Heading1,
  Heading2,
  GripHorizontal,
} from 'lucide-react';
import {InputDialog} from "@/modules/common/components";

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onCharCountChange: (count: number) => void;
  placeholder?: string;
  maxHeight?: number;
  minHeight?: number;
  maxChars?: number;
  className?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  onCharCountChange,
  placeholder,
  maxHeight = 500,
  minHeight = 120,
  maxChars = 5000,
  className,
}: RichTextEditorProps) {
  const { t } = useTranslation();
  const defaultPlaceholder = t('editor.writeSomething');
  const [editorHeight, setEditorHeight] = React.useState(minHeight);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const isResizingRef = React.useRef(false);
  const startYRef = React.useRef(0);
  const startHeightRef = React.useRef(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || defaultPlaceholder,
      }),
      CharacterCount.configure({
        limit: maxChars,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-secondary rounded-lg p-4 font-mono text-sm',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none',
          'focus:outline-none',
          'min-h-[80px] p-4 text-sm text-foreground',
          'overflow-y-auto scrollbar-thin'
        ),
        style: `min-height: ${editorHeight}px; max-height: ${maxHeight}px;`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      onCharCountChange(editor.storage.characterCount.characters());
    },
    immediatelyRender: false,
  });

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = editorHeight;
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const delta = e.clientY - startYRef.current;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeightRef.current + delta));
    setEditorHeight(newHeight);
  };

  const handleResizeEnd = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleOpenLinkDialog = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setIsLinkDialogOpen(true);
  };

  const handleLinkSubmit = (url: string) => {
    if (!editor) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setIsLinkDialogOpen(false);
    setLinkUrl('');
  };


  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    title,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-md hover:bg-accent transition-colors',
        isActive && 'bg-accent text-primary'
      )}
      title={title}
      type="button"
    >
      {children}
    </button>
  );

  const percentage = editor.storage.characterCount.characters()
    ? Math.round((1 - editor.storage.characterCount.characters() / maxChars) * 100)
    : 100;

  return (
    <>
      <div
        className={cn('border border-input rounded-xl overflow-hidden bg-background', className)}
      >
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-0.5 pr-2 border-r border-border mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              title={t('editor.undo')}
            >
              <Undo className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              title={t('editor.redo')}
            >
              <Redo className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
          </div>

          <div className="flex items-center gap-0.5 pr-2 border-r border-border mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title={t('editor.heading1')}
            >
              <Heading1 className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title={t('editor.heading2')}
            >
              <Heading2 className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
          </div>

          <div className="flex items-center gap-0.5 pr-2 border-r border-border mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title={t('editor.bold')}
            >
              <Bold className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title={t('editor.italic')}
            >
              <Italic className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title={t('editor.underline')}
            >
              <UnderlineIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title={t('editor.strikethrough')}
            >
              <Strikethrough className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              title={t('editor.highlight')}
            >
              <Highlighter className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
          </div>

          <div className="flex items-center gap-0.5 pr-2 border-r border-border mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title={t('editor.alignLeft')}
            >
              <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title={t('editor.alignCenter')}
            >
              <AlignCenter className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title={t('editor.alignRight')}
            >
              <AlignRight className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
          </div>

          <div className="flex items-center gap-0.5 pr-2 border-r border-border mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title={t('editor.bulletList')}
            >
              <List className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title={t('editor.orderedList')}
            >
              <ListOrdered className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive('taskList')}
              title={t('editor.taskList')}
            >
              <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title={t('editor.blockquote')}
            >
              <Quote className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
              title={t('editor.codeBlock')}
            >
              <Code className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
          </div>

          <div className="flex items-center gap-0.5 pr-2 border-r border-border mr-1">
            <ToolbarButton
              onClick={handleOpenLinkDialog}
              isActive={editor.isActive('link')}
              title={t('editor.link')}
            >
              <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title={t('editor.insertDivider')}
            >
              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
          </div>

          <div className="flex items-center gap-0.5">
            <ToolbarButton
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
              title={t('editor.clearFormat')}
            >
              <Eraser className="h-3.5 w-3.5 text-muted-foreground" />
            </ToolbarButton>
          </div>
        </div>

        <EditorContent editor={editor} />

        <div
          className="flex items-center justify-center h-6 border-t border-border bg-secondary/30 cursor-ns-resize hover:bg-secondary/50 transition-colors"
          onMouseDown={handleResizeStart}
        >
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <InputDialog
        isOpen={isLinkDialogOpen}
        onClose={() => {
          setIsLinkDialogOpen(false);
          setLinkUrl('');
        }}
        title={t('editor.insertLink')}
        label={t('editor.linkUrl')}
        placeholder="https://example.com"
        initialValue={linkUrl}
        type="url"
        icon={<LinkIcon className="h-4 w-4 text-primary" />}
        confirmText={t('editor.confirm')}
        cancelText={t('editor.cancel')}
        onConfirm={handleLinkSubmit}
      />
    </>
  );
}
