'use client';

import { useEffect, useRef, useState } from 'react';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function QuillEditor({ value, onChange, placeholder }: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !editorRef.current || quillRef.current) return;

    const load = async () => {
      const [{ default: Quill }, { default: DOMPurify }] = await Promise.all([
        import('quill'),
        import('isomorphic-dompurify'),
      ]);

      // Load quill snow theme CSS dynamically
      if (!document.querySelector('link[href*="quill"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css';
        document.head.appendChild(link);
      }

      const quill = new Quill(editorRef.current!, {
        theme: 'snow',
        placeholder: placeholder ?? 'Write your post content here...',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            [{ color: [] }, { background: [] }],
            ['clean'],
          ],
        },
      });

      quillRef.current = quill;

      // Set initial value
      if (value) {
        quill.clipboard.dangerouslyPasteHTML(DOMPurify.sanitize(value));
      }

      quill.on('text-change', () => {
        const html = quill.getSemanticHTML();
        const sanitized = DOMPurify.sanitize(html);
        onChange(sanitized);
      });
    };

    load();

    return () => {
      quillRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="h-64 w-full rounded-xl border border-slate-700 bg-slate-900 animate-pulse" />
    );
  }

  return (
    <div className="quill-wrapper rounded-xl overflow-hidden border border-slate-700">
      <div ref={editorRef} className="min-h-[280px] bg-slate-900 text-slate-100" />
    </div>
  );
}
