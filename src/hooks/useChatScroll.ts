// adatpated from: https://dev.to/deepcodes/automatic-scrolling-for-chat-app-in-1-line-of-code-react-hook-3lm1

import { useEffect, useRef, useState } from 'react'

const useChatScroll = <T>(
  scrollActivator: T
): [
  React.MutableRefObject<HTMLDivElement | undefined>,
  React.Dispatch<React.SetStateAction<boolean>>
] => {
  const ref = useRef<HTMLDivElement>()

  const [shouldScroll, setShouldScroll] = useState(true)

  useEffect(() => {
    if (typeof ref?.current !== 'undefined' && shouldScroll) {
      console.debug(ref.current.scrollTop, ref.current.scrollHeight)
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [scrollActivator, shouldScroll])

  return [ref, setShouldScroll]
}

export default useChatScroll
