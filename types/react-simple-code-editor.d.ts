declare module 'react-simple-code-editor' {
  import { ComponentType, CSSProperties } from 'react';

  interface EditorProps {
    value: string;
    onValueChange: (value: string) => void;
    highlight: (code: string) => string;
    padding?: number | string;
    style?: CSSProperties;
    textareaClassName?: string;
    preClassName?: string;
    className?: string;
    tabSize?: number;
    insertSpaces?: boolean;
    ignoreTabKey?: boolean;
    textareaId?: string;
  }

  const Editor: ComponentType<EditorProps>;
  export default Editor;
}
