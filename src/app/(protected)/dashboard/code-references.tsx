'iuse client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

        </Tabs>
    </div>
  )
}

export default CodeReferences