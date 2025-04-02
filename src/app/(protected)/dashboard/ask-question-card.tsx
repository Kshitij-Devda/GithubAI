'use client'

import React from 'react'
import useProject from '@/hooks/use-project'
import { CardHeader , Card, CardTitle, CardContent} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Dialog } from '@radix-ui/react-dialog'
import Image from 'next/image'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { askQuestion } from './action'
import { readStreamableValue } from 'ai/rsc'
import MDEditor from '@uiw/react-md-editor'    
import CodeReferences from './code-references'

const AskQuestionCard = () => {
    const {project} = useProject()
    const [question, setQuestion] = React.useState('')
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [fileReference, setFileReference] = React.useState<{ fileName : string, sourceCode :string, summary :string}[]>([])
    const [answer, setAnswer] = React.useState('')

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if(!project?.id) return
        setLoading(true)
        setOpen(true)

        const {output, fileReference} = await askQuestion(question, project.id)
        setFileReference(fileReference)

        for await (const delta of readStreamableValue(output)){
            if(delta){
                setAnswer(ans=> ans + delta)
            }
        }
        setLoading(false)
    }

  return (
   <>
   <Dialog open={open} onOpenChange={setOpen}>
  
   <DialogContent className='sm-max-w-[80vw] '>
   <DialogHeader>
        <DialogTitle>
            <Image src='/github.png' alt='logo' width={40} height={40} />
        </DialogTitle>
    </DialogHeader>
    <MDEditor.Markdown source={answer} className='max-w-{70vw} !h-full max-h-[70vh] overflow-y-auto' />
    <div className="h-4"></div>
    <CodeReferences fileReference={fileReference} />
    
    <h1>File References</h1>
    {fileReference.map(file=>{
        return<span>{file.fileName}</span>
    })}
   </DialogContent>
   </Dialog>
   <Card className='relative col-span-3'>
    <CardHeader>
        <CardTitle>Ask a Question</CardTitle>
    </CardHeader>
    <CardContent>
        <form onSubmit={onSubmit}>
            <Textarea placeholder='which file should I edit to change the home page?' value={question} onChange={(e) => setQuestion(e.target.value)} />
             <div className="h-4"></div>
             <Button type='submit'>
                Ask AI Supporter
             </Button>
        </form>

    </CardContent>
   </Card>
   </>
  )
}

export default AskQuestionCard