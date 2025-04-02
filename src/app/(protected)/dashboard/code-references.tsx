'iuse client'

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

        <div className="max-w-{70vw}">
        <Tabs value={tab} onValueChange={setTab}>
<div className="overflow-scroll flex gap-2 bg-gray-200 p-1 rounded-md">
{
  fileReference.map((file) => (
    <button key={file.fileName} className={cn(
      'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap text-muted-foreground hover:bg-muted',
      {
        'bg-primary text-primary-foreground': tab === file.fileName,

      }
  )}>
      {file.fileName}
    </button>
  ))}  
  </div>
        {fileReference.map(file => (
          <TabsContent key={file.fileName} value={file.fileName} className='max-h-[40vh] overflow-scroll max-w-7xl rounded-md'>
            <SyntaxHighlighter language='typescript' style={lucario}>
{file.sourceCode || 'No code available'}
            </SyntaxHighlighter>
          </TabsContent>
        ))}
        </Tabs>
    </div>
  )
}

export default CodeReferences