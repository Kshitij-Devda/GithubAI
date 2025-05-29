'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {cn} from '@/lib/utils'
import {lucario} from 'react-syntax-highlighter/dist/esm/styles/prism'

type Props = {
    fileReference :{
        fileName : string,
        sourceCode : string,
        summary : string
    }[]
}

const CodeReferences = ({fileReference}: Props) => {
    const [tab, setTab] = React.useState(fileReference[0]?.fileName)
    if(fileReference.length === 0) return null
  return (
    <div className="w-full">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto flex gap-2 bg-gray-200 p-1 rounded-md mb-2">
          {fileReference.map((file) => (
            <button 
              key={file.fileName} 
              onClick={() => setTab(file.fileName)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap text-muted-foreground hover:bg-muted',
                {
                  'bg-primary text-primary-foreground': tab === file.fileName,
                }
              )}
            >
              {file.fileName}
            </button>
          ))}  
        </div>
        
        <div className="w-full max-h-[30vh] overflow-auto rounded-md">
          {fileReference.map(file => (
            <TabsContent 
              key={file.fileName} 
              value={file.fileName}
              className="w-full m-0 p-0"
            >
              <SyntaxHighlighter 
                language='typescript' 
                style={lucario}
                wrapLines={true}
                wrapLongLines={true}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: '100%'
                }}
              >
                {file.sourceCode || 'No code available'}
              </SyntaxHighlighter>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  )
}

export default CodeReferences