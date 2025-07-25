"use client"

import { useRef, useState } from "react"
import { Editor } from "@monaco-editor/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Save, Settings } from "lucide-react"

interface CodeEditorProps {
  file: any
  collaborators: any[]
  currentUser: any
  onContentChange: (fileId: string, content: string) => void
  onCursorChange: (fileId: string, cursor: any, userId: string) => void
}

export function CodeEditor({ file, collaborators, currentUser, onContentChange, onCursorChange }: CodeEditorProps) {
  const editorRef = useRef<any>(null)
  const [theme, setTheme] = useState("vs-dark")
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState("")

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // Add cursor tracking
    editor.onDidChangeCursorPosition((e: any) => {
      onCursorChange(
        file.id,
        {
          line: e.position.lineNumber,
          column: e.position.column,
        },
        currentUser.id,
      )
    })

    // Add selection tracking
    editor.onDidChangeCursorSelection((e: any) => {
      if (!e.selection.isEmpty()) {
        onCursorChange(
          file.id,
          {
            line: e.selection.startLineNumber,
            column: e.selection.startColumn,
            endLine: e.selection.endLineNumber,
            endColumn: e.selection.endColumn,
            isSelection: true,
          },
          currentUser.id,
        )
      }
    })

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "JetBrains Mono, Consolas, Monaco, monospace",
      lineNumbers: "on",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "on",
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    })
  }

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined && value !== file.content) {
      onContentChange(file.id, value)
    }
  }

  const runCode = async () => {
    setIsRunning(true)
    setOutput("Running code...\n")

    // Simulate code execution
    setTimeout(() => {
      if (file.language === "javascript") {
        try {
          // Simple JavaScript execution simulation
          const result = eval(file.content)
          setOutput(`Output:\n${result}`)
        } catch (error) {
          setOutput(`Error:\n${error}`)
        }
      } else {
        setOutput(
          `Code execution for ${file.language} is not implemented in this demo.\nOutput would appear here in a real implementation.`,
        )
      }
      setIsRunning(false)
    }, 1000)
  }

  const getLanguageFromExtension = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    const languageMap: { [key: string]: string } = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      sql: "sql",
      php: "php",
      go: "go",
      rs: "rust",
      rb: "ruby",
    }
    return languageMap[ext || ""] || "plaintext"
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="h-12 bg-gray-100 border-b flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{file.language || getLanguageFromExtension(file.name)}</Badge>
          <span className="text-sm text-gray-600">{file.name}</span>
          {collaborators.filter((c) => c.currentFile === file.id).length > 0 && (
            <Badge variant="outline" className="text-xs">
              {collaborators.filter((c) => c.currentFile === file.id).length} editing
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={runCode} disabled={isRunning}>
            <Play className="h-4 w-4 mr-1" />
            {isRunning ? "Running..." : "Run"}
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={getLanguageFromExtension(file.name)}
          value={file.content || ""}
          theme={theme}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: "line",
            automaticLayout: true,
            glyphMargin: true,
            folding: true,
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            wrappingIndent: "indent",
            renderLineHighlight: "all",
            contextmenu: true,
            mouseWheelZoom: true,
            smoothScrolling: true,
            cursorBlinking: "blink",
            cursorSmoothCaretAnimation: "on",
            renderWhitespace: "selection",
            renderControlCharacters: false,
            fontLigatures: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
          }}
        />

        {/* Collaborator Cursors */}
        {collaborators.map(
          (collaborator) =>
            collaborator.cursor &&
            collaborator.id !== currentUser.id &&
            collaborator.currentFile === file.id && (
              <div
                key={collaborator.id}
                className="absolute pointer-events-none z-10"
                style={{
                  top: `${(collaborator.cursor.line - 1) * 19}px`,
                  left: `${collaborator.cursor.column * 7}px`,
                  borderLeft: `2px solid ${collaborator.color}`,
                  height: "19px",
                }}
              >
                <div
                  className="absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded"
                  style={{ backgroundColor: collaborator.color }}
                >
                  {collaborator.full_name}
                </div>
              </div>
            ),
        )}
      </div>

      {/* Output Panel */}
      {output && (
        <div className="h-32 bg-black text-green-400 font-mono text-sm p-4 border-t overflow-auto">
          <pre>{output}</pre>
        </div>
      )}
    </div>
  )
}
