import Markdown from '@/util/MarkScribe'


function App() {
  let md = new Markdown();
  console.log(md.parse(`# GGG`))
  let md2 = new Markdown();
  console.log(md2.parse(`# GG2`))
  return (
    <>
      hello,world
    </>
  )
}

export default App
