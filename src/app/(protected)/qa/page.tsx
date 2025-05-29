'use client'

import useProject from '@/hooks/use-project'
import { api } from '@/trpc/react'
import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import AskQuestionCard from '../dashboard/ask-question-card'
import MDEditor from '@uiw/react-md-editor'
import CodeReferences from '../dashboard/code-references'

const QAPage = () =>{
    const { projectId } = useProject()
    const {data : questions} = api.project.getQuestions.useQuery({projectId:projectId ?? ""})
    const [questionIndex, setQuestionIndex] = React.useState(0)
    const question = questions?.[questionIndex]

    return(
       <Sheet>
        <AskQuestionCard />
        <div className="h-4"></div>
        <h1 className='text-xl font-semibold'>Saved Questions</h1>
        <div className="h-2"></div>
        <div className="flex flex-col gap-2">
            {questions?.map((question: { id: string }, index: number)=>{
                return <React.Fragment key={question.id}>
                    <SheetTrigger onClick={()=>setQuestionIndex(index)}>
                        <div className='flex items-center gap-4 bg-white rounded-lg p-4 shadow border'>
                            <img className='w-10 h-10 rounded-full' height={30} width={30} src={(question as any).user?.imageUrl ?? ""} />

                            <div className='text-left flex flex-col'>
                                <div className='flex items-center gap-2'>
                                    <p className='text-gray-700 line-clamp-1 text-lg font-medium'>
                                    {(question as any).question}
                                    </p>
                                    <span className='text-xs text-gray-400 whitespace-nowrap'>
                                        {(question as any).createdAt.toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <p className='text-gray-500 line-clamp-1 text-sm'>
                                    {(question as any).answer}
                                </p>
                            </div>
                        </div>
                    </SheetTrigger>
                </React.Fragment>
            })}
        </div>
        {question && (
            <SheetContent className='sm:max-w-[80vw]'>
                <SheetHeader>
                    <SheetTitle>
                        {questions.question}
                    </SheetTitle>
                    <MDEditor.Markdown source={question.answer} />
                    <CodeReferences fileReference={(question.fileReference ?? []) as any} />
                </SheetHeader>
            </SheetContent>
        )}
       </Sheet>
    )
}
export default QAPage